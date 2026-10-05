"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { priceCart, type PricedLine } from "@/lib/orders/cart";
import { createOrder, type PlaceOrderResult } from "@/lib/orders/create-order";
import type { OrderTotals } from "@/lib/orders/pricing";
import { getPaymentMethodOptions, type PaymentMethodOption } from "@/lib/payments/policy";
import { devRateLimit } from "@/lib/security/rate-limit";
import { cartLinesSchema, placeOrderSchema, type CartLineInput, type PlaceOrderInput } from "@/lib/validations/checkout";

export type CheckoutQuote =
  | {
      success: true;
      lines: PricedLine[];
      unavailableIds: string[];
      totals: OrderTotals;
      paymentOptions: PaymentMethodOption[];
    }
  | { success: false; error: string };

/**
 * Server-priced summary for the checkout page. Display only: placeOrder
 * recalculates everything again when the order is submitted.
 */
export async function getCheckoutQuote(items: CartLineInput[]): Promise<CheckoutQuote> {
  const parsed = cartLinesSchema.safeParse(items);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Your cart couldn't be read." };

  try {
    const cart = await priceCart(parsed.data);
    return {
      success: true,
      lines: cart.lines,
      unavailableIds: cart.unavailableIds,
      totals: cart.totals,
      paymentOptions: getPaymentMethodOptions({ orderType: "STANDARD", total: cart.totals.total })
    };
  } catch (error) {
    console.error("Checkout quote error:", error instanceof Error ? error.message : error);
    return { success: false, error: "We couldn't load current prices. Please refresh and try again." };
  }
}

/** Checkout submit: session → validation → server pricing → order + payment + history. */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Please log in to place your order." };
  if (user.role !== "CUSTOMER") return { success: false, error: "Staff accounts can't place customer orders. Please use a customer account." };

  if (!devRateLimit(`place-order:${user.id}`, 10, 60_000).ok) {
    return { success: false, error: "Too many attempts. Please wait a minute and try again." };
  }

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check your order details." };
  }

  try {
    return await createOrder(user, parsed.data);
  } catch (error) {
    console.error("Place order error:", error instanceof Error ? error.message : error);
    return { success: false, error: "We couldn't place your order. Please try again, or contact us on WhatsApp." };
  }
}
