import { after } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Actor } from "@/lib/auth/guards";
import { requiresPrepayment } from "@/lib/payments/policy";
import { getProviderById } from "@/lib/payments/registry";
import { notifyChefAssigned, notifyOrderStatusChanged, notifyPaymentReceived } from "@/lib/notifications/orders";
import { ORDER_STATUS_LABELS, canRoleTransition, isTerminalStatus } from "./status";

export type OperationResult = { ok: true } | { ok: false; error: string };

const STALE_ERROR = "This order was just updated by someone else. Refresh the page and try again.";

function audit(actor: Actor, action: string, entity: string, entityId: string, metadata?: Prisma.InputJsonValue) {
  return prisma.auditLog
    .create({ data: { actorId: actor.userId, action, entity, entityId, metadata } })
    .catch(() => undefined);
}

function statusTimestamps(to: OrderStatus): Prisma.OrderUpdateManyMutationInput {
  const now = new Date();
  if (to === "CONFIRMED") return { confirmedAt: now };
  if (to === "DELIVERED") return { deliveredAt: now };
  if (to === "CANCELLED") return { cancelledAt: now };
  return {};
}

type TransitionInput = {
  orderId: string;
  to: OrderStatus;
  actor: Actor;
  /** Required when a chef acts: their HomeChef id. */
  chefId?: string;
  note?: string;
  /** Marking a COD order delivered: was the cash collected? */
  codCollected?: boolean;
  cancellationReason?: string;
};

/**
 * Moves an order to a new status after checking the lifecycle, the actor's
 * role and (for chefs) their assignment. Uses a compare-and-set update so two
 * people clicking at once can't both apply a transition.
 */
export async function transitionOrder(input: TransitionInput): Promise<OperationResult> {
  const { orderId, to, actor } = input;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      orderType: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      assignedChefId: true,
      chefAssignments: { where: { status: { in: ["ASSIGNED", "ACCEPTED"] } }, select: { id: true, homeChefId: true, status: true } }
    }
  });
  if (!order) return { ok: false, error: "Order not found." };

  const from = order.status;
  if (!canRoleTransition(actor.role, from, to)) {
    return { ok: false, error: `This order can't move from “${ORDER_STATUS_LABELS[from]}” to “${ORDER_STATUS_LABELS[to]}”.` };
  }

  if (actor.role === "HOME_CHEF") {
    const assignment = order.chefAssignments.find((candidate) => candidate.homeChefId === input.chefId);
    if (!input.chefId || order.assignedChefId !== input.chefId || !assignment) {
      return { ok: false, error: "This order isn't assigned to you." };
    }
    if (assignment.status !== "ACCEPTED") return { ok: false, error: "Accept the order first, then continue." };
  }

  if (to === "CONFIRMED" && requiresPrepayment({ orderType: order.orderType, total: order.totalAmount }) && order.paymentStatus !== "PAID") {
    return { ok: false, error: "This order needs a verified payment before it can be confirmed." };
  }

  const reason = input.cancellationReason?.trim().slice(0, 300) || null;
  if (to === "CANCELLED" && !reason) return { ok: false, error: "Add a short reason for cancelling." };

  const collectCash = to === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID" && input.codCollected === true;

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: from },
        data: {
          status: to,
          ...statusTimestamps(to),
          ...(to === "CANCELLED" ? { cancellationReason: reason } : {})
        }
      });
      if (updated.count !== 1) throw new StaleOrderError();

      if (collectCash) {
        await tx.payment.updateMany({
          where: { orderId: order.id, method: "COD", status: { in: ["PENDING", "PROCESSING"] } },
          data: { status: "PAID", paidAt: new Date(), recordedById: actor.userId }
        });
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
      }

      if (to === "CANCELLED") {
        await tx.payment.updateMany({
          where: { orderId: order.id, status: { in: ["PENDING", "PROCESSING"] } },
          data: { status: "CANCELLED", failureReason: "Order cancelled" }
        });
        // Paid orders keep PAID so the refund stays visible in /admin/payments.
        if (order.paymentStatus !== "PAID") {
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "CANCELLED" } });
        }
        await tx.chefAssignment.updateMany({
          where: { orderId: order.id, status: { in: ["ASSIGNED", "ACCEPTED"] } },
          data: { status: "CANCELLED", endedAt: new Date() }
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: from,
          toStatus: to,
          changedById: actor.userId,
          changedByRole: actor.role,
          note: [input.note?.trim(), to === "CANCELLED" ? reason : null, collectCash ? "Cash collected" : null].filter(Boolean).join(" · ") || null
        }
      });
    });
  } catch (error) {
    if (error instanceof StaleOrderError) return { ok: false, error: STALE_ERROR };
    throw error;
  }

  await audit(actor, "ORDER_STATUS_CHANGED", "Order", order.id, { from, to, codCollected: collectCash });
  after(async () => {
    await notifyOrderStatusChanged(order.id, to);
    if (collectCash) await notifyPaymentReceived(order.id);
  });

  return { ok: true };
}

class StaleOrderError extends Error {}

/** Admin assigns (or reassigns) a chef and optionally one of their kitchens. */
export async function assignChef({
  orderId,
  homeChefId,
  kitchenId,
  actor,
  note
}: {
  orderId: string;
  homeChefId: string;
  kitchenId?: string | null;
  actor: Actor;
  note?: string;
}): Promise<OperationResult> {
  if (actor.role !== "ADMIN") return { ok: false, error: "Only admins can assign chefs." };

  const [order, chef] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true, assignedChefId: true, assignedKitchenId: true }
    }),
    prisma.homeChef.findUnique({
      where: { id: homeChefId },
      select: { id: true, userId: true, isActive: true, displayName: true, kitchens: { select: { id: true } } }
    })
  ]);

  if (!order) return { ok: false, error: "Order not found." };
  if (isTerminalStatus(order.status) || order.status === "READY" || order.status === "OUT_FOR_DELIVERY") {
    return { ok: false, error: `A chef can't be assigned once the order is ${ORDER_STATUS_LABELS[order.status].toLowerCase()}.` };
  }
  if (!chef || !chef.isActive) return { ok: false, error: "Choose an active chef." };
  if (!chef.userId) return { ok: false, error: `${chef.displayName} has no linked login yet, so they couldn't see the order.` };

  const kitchen = kitchenId ? chef.kitchens.find((candidate) => candidate.id === kitchenId) : chef.kitchens[0];
  if (kitchenId && !kitchen) return { ok: false, error: "That kitchen doesn't belong to the selected chef." };

  if (order.assignedChefId === chef.id && order.assignedKitchenId === (kitchen?.id ?? null)) return { ok: true };

  await prisma.$transaction(async (tx) => {
    await tx.chefAssignment.updateMany({
      where: { orderId: order.id, status: { in: ["ASSIGNED", "ACCEPTED"] } },
      data: { status: "REPLACED", endedAt: new Date() }
    });
    await tx.chefAssignment.create({
      data: { orderId: order.id, homeChefId: chef.id, kitchenId: kitchen?.id ?? null, assignedById: actor.userId, note: note?.trim() || null }
    });
    await tx.order.update({ where: { id: order.id }, data: { assignedChefId: chef.id, assignedKitchenId: kitchen?.id ?? null } });
  });

  await audit(actor, "ORDER_CHEF_ASSIGNED", "Order", order.id, { homeChefId: chef.id, kitchenId: kitchen?.id ?? null });
  after(() => notifyChefAssigned(order.id, chef.userId, order.orderNumber));
  return { ok: true };
}

/** Chef accepts an order assigned to them. */
export async function acceptAssignment({ orderId, chefId, actor }: { orderId: string; chefId: string; actor: Actor }): Promise<OperationResult> {
  const updated = await prisma.chefAssignment.updateMany({
    where: { orderId, homeChefId: chefId, status: "ASSIGNED", order: { status: { notIn: ["CANCELLED", "DELIVERED"] }, assignedChefId: chefId } },
    data: { status: "ACCEPTED", acceptedAt: new Date() }
  });
  if (updated.count === 0) return { ok: false, error: "This order is no longer waiting for you to accept it." };

  await audit(actor, "ORDER_ACCEPTED_BY_CHEF", "Order", orderId, { chefId });
  return { ok: true };
}

/**
 * Admin records money received outside the app: COD cash, bank transfer or
 * invoice payment. Online methods can never be marked paid by hand.
 */
export async function recordOfflinePayment({
  paymentId,
  actor,
  reference
}: {
  paymentId: string;
  actor: Actor;
  reference?: string;
}): Promise<OperationResult> {
  if (actor.role !== "ADMIN") return { ok: false, error: "Only admins can record payments." };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      provider: true,
      status: true,
      orderId: true,
      corporateQuoteId: true,
      order: { select: { status: true } },
      corporateQuote: { select: { requestId: true } }
    }
  });
  if (!payment) return { ok: false, error: "Payment not found." };
  if (!getProviderById(payment.provider)?.offline) {
    return { ok: false, error: "Online payments are confirmed only by the payment provider." };
  }
  if (payment.status !== "PENDING" && payment.status !== "PROCESSING") {
    return { ok: false, error: "Only pending payments can be recorded as received." };
  }
  if (payment.order && payment.provider === "cod" && !["OUT_FOR_DELIVERY", "DELIVERED"].includes(payment.order.status)) {
    return { ok: false, error: "Cash is collected on delivery. Record it once the order is out for delivery or delivered." };
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "PAID", paidAt: new Date(), recordedById: actor.userId, providerReference: reference?.trim() || undefined }
    });
    if (updated.count !== 1) throw new StaleOrderError();

    if (payment.orderId) {
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "PAID" } });
    }
    if (payment.corporateQuote) {
      await tx.corporateRequest.update({
        where: { id: payment.corporateQuote.requestId },
        data: { status: "CONVERTED", convertedAt: new Date() }
      });
    }
  }).catch((error: unknown) => {
    if (error instanceof StaleOrderError) return;
    throw error;
  });

  await audit(actor, "PAYMENT_RECORDED", "Payment", payment.id, { reference: reference?.trim() || null });
  if (payment.orderId) {
    const orderId = payment.orderId;
    after(() => notifyPaymentReceived(orderId));
  }
  return { ok: true };
}
