import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/app-url";
import type { CurrentUser } from "@/lib/auth/guards";
import type { PlaceOrderInput } from "@/lib/validations/checkout";
import { getProviderForMethod } from "@/lib/payments/registry";
import { isMethodAllowed } from "@/lib/payments/policy";
import { notifyOrderPlaced } from "@/lib/notifications/orders";
import { priceCart } from "./cart";
import { earliestServiceDate } from "./schedule";
import { generateOrderNumber, isUniqueViolationOn, withUniqueReference } from "./order-number";

export type PlaceOrderResult =
  | { success: true; orderNumber: string; redirectTo: string }
  | { success: false; error: string; unavailableItemIds?: string[] };

function confirmationPath(orderNumber: string) {
  return `/order/success?order=${encodeURIComponent(orderNumber)}`;
}

async function findExistingOrder(idempotencyKey: string) {
  return prisma.order.findUnique({ where: { idempotencyKey }, select: { orderNumber: true } });
}

/** Reuse the customer's saved address when it matches, otherwise save a new one. */
async function resolveAddressId(userId: string, area: string, address: string) {
  const existing = await prisma.address.findFirst({
    where: {
      userId,
      area: { equals: area, mode: "insensitive" },
      address: { equals: address, mode: "insensitive" }
    },
    select: { id: true }
  });
  if (existing) return existing.id;

  const created = await prisma.address.create({
    data: { userId, label: "Office", city: "Lahore", area, address },
    select: { id: true }
  });
  return created.id;
}

/**
 * Secure order creation. The caller has already verified the session; this
 * validates the cart against the database, recalculates every amount, and writes
 * the order, its items, the payment record and the first status entry in one
 * transaction. Double submissions with the same idempotency key return the
 * original order instead of creating a second one.
 */
export async function createOrder(user: CurrentUser, input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const idempotencyKey = `${user.id}:${input.idempotencyKey}`;
  const existing = await findExistingOrder(idempotencyKey);
  if (existing) return { success: true, orderNumber: existing.orderNumber, redirectTo: confirmationPath(existing.orderNumber) };

  const cart = await priceCart(input.items);
  if (cart.unavailableIds.length > 0 || cart.lines.length === 0) {
    return {
      success: false,
      error: "Some items in your cart are no longer available. Please remove them and try again.",
      unavailableItemIds: cart.unavailableIds
    };
  }

  const { totals } = cart;
  const paymentContext = { orderType: "STANDARD" as const, total: totals.total };
  if (!isMethodAllowed(paymentContext, input.paymentMethod)) {
    return { success: false, error: "That payment method isn't available yet. Please choose Cash on Delivery." };
  }
  const provider = getProviderForMethod(input.paymentMethod);

  const email = user.email;
  if (!email) return { success: false, error: "Your account has no email address. Please contact support." };

  const addressId = await resolveAddressId(user.id, input.area, input.address);
  const deliveryDate = earliestServiceDate(cart.lines.map((line) => line.day));

  let order: { id: string; orderNumber: string; payments: Array<{ id: string }> };
  try {
    order = await withUniqueReference("orderNumber", generateOrderNumber, (orderNumber) =>
      prisma.order.create({
        data: {
          orderNumber,
          idempotencyKey,
          userId: user.id,
          orderType: "STANDARD",
          customerName: input.fullName,
          customerEmail: email,
          customerPhone: input.phone,
          customerWhatsapp: input.whatsappNumber || null,
          companyName: input.company || null,
          addressId,
          deliveryAddress: input.address,
          deliveryArea: input.area,
          deliveryCity: "Lahore",
          deliveryDate,
          deliverySlot: input.deliverySlot,
          specialInstructions: input.instructions || null,
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          discount: totals.discount,
          totalAmount: totals.total,
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING",
          items: {
            create: cart.lines.map((line) => ({
              menuOptionId: line.menuOptionId,
              itemName: line.name,
              itemDetails: line.details,
              serviceDay: line.day,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal
            }))
          },
          payments: {
            create: {
              userId: user.id,
              provider: provider.id,
              method: input.paymentMethod,
              amount: totals.total,
              currency: "PKR",
              status: "PENDING"
            }
          },
          statusHistory: {
            create: { toStatus: "PENDING", changedById: user.id, changedByRole: user.role, note: "Order placed" }
          }
        },
        select: { id: true, orderNumber: true, payments: { select: { id: true } } }
      })
    );
  } catch (error) {
    // A parallel submission with the same key won the race: return that order.
    if (isUniqueViolationOn(error, "idempotencyKey")) {
      const winner = await findExistingOrder(idempotencyKey);
      if (winner) return { success: true, orderNumber: winner.orderNumber, redirectTo: confirmationPath(winner.orderNumber) };
    }
    throw error;
  }

  // Remember delivery details for next time. Not critical to the order.
  await prisma.profile
    .upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        phone: input.phone,
        whatsappNumber: input.whatsappNumber || null,
        companyName: input.company || null,
        deliveryArea: input.area,
        officeAddress: input.address
      },
      update: {
        phone: input.phone,
        whatsappNumber: input.whatsappNumber || null,
        companyName: input.company || null,
        deliveryArea: input.area,
        officeAddress: input.address
      }
    })
    .catch((error: unknown) => console.error("Profile update after order failed:", error instanceof Error ? error.message : error));

  await prisma.auditLog
    .create({ data: { actorId: user.id, action: "ORDER_CREATED", entity: "Order", entityId: order.id, metadata: { orderNumber: order.orderNumber, total: totals.total, paymentMethod: input.paymentMethod } } })
    .catch(() => undefined);

  // Emails run after the response is sent, so a slow mail server never delays checkout.
  after(() => notifyOrderPlaced(order.id));

  if (provider.offline) {
    return { success: true, orderNumber: order.orderNumber, redirectTo: confirmationPath(order.orderNumber) };
  }

  // Online payment: hand the customer to the provider. The order stays PENDING
  // and unpaid until the provider's verified webhook/response says otherwise.
  const paymentId = order.payments[0].id;
  try {
    const appUrl = getAppUrl();
    const init = await provider.initializePayment({
      paymentId,
      orderNumber: order.orderNumber,
      amount: totals.total,
      currency: "PKR",
      customer: { name: input.fullName, email, phone: input.phone },
      returnUrl: `${appUrl}/api/payments/return/${provider.id}?payment=${paymentId}`,
      webhookUrl: `${appUrl}/api/webhooks/payments/${provider.id}`
    });

    if (init.kind === "redirect") {
      await prisma.payment.update({ where: { id: paymentId }, data: { status: "PROCESSING", providerReference: init.providerReference } });
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PROCESSING" } });
      return { success: true, orderNumber: order.orderNumber, redirectTo: init.redirectUrl };
    }

    // Form-post and other flows are wired up when a provider needs them.
    throw new Error(`Unsupported payment initialisation: ${init.kind}`);
  } catch (error) {
    console.error(`Payment initialisation (${provider.id}) failed:`, error instanceof Error ? error.message : error);
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED", failureReason: "Could not start online payment" } });
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return { success: true, orderNumber: order.orderNumber, redirectTo: `${confirmationPath(order.orderNumber)}&payment=failed` };
  }
}
