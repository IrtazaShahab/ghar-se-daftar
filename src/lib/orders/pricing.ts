/**
 * Order pricing rules. Pure functions shared by the server (authoritative) and
 * the checkout UI (display only). The server always recomputes from database
 * prices; totals sent by the browser are never used.
 */

export const FREE_DELIVERY_THRESHOLD = 500;
export const STANDARD_DELIVERY_FEE = 100;
export const FREE_DELIVERY_MESSAGE = `Free delivery on orders of Rs. ${FREE_DELIVERY_THRESHOLD} or more.`;

export type OrderTotals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

export function calculateDeliveryFee(subtotal: number) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

/**
 * Discount hook. There are no promotions yet, so this is always 0; promo codes
 * or corporate pricing plug in here without touching order creation.
 */
export function calculateDiscount(_subtotal: number) {
  return 0;
}

export function calculateOrderTotals(subtotal: number): OrderTotals {
  if (!Number.isInteger(subtotal) || subtotal < 0) {
    throw new Error("Subtotal must be a non-negative whole number");
  }

  const deliveryFee = calculateDeliveryFee(subtotal);
  const discount = Math.min(calculateDiscount(subtotal), subtotal + deliveryFee);

  return {
    subtotal,
    deliveryFee,
    discount,
    total: subtotal + deliveryFee - discount
  };
}

/** Rupees still needed to unlock free delivery (0 when already free). */
export function amountToFreeDelivery(subtotal: number) {
  return Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
}
