import type { PaymentMethod, PaymentStatus } from "@prisma/client";

/** Display helpers shared by pages and emails. Amounts are whole PKR. */

export function formatRs(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

/** "FREE" for zero delivery, otherwise the amount. */
export function formatDeliveryFee(amount: number) {
  return amount === 0 ? "FREE" : formatRs(amount);
}

const PK_TIME_ZONE = "Asia/Karachi";

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: PK_TIME_ZONE }).format(date);
}

export function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "short", timeZone: PK_TIME_ZONE }).format(date);
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  CARD: "Debit / Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  INVOICE: "Invoice / Monthly Billing"
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled"
};

export const DELIVERY_SLOTS = [
  { value: "12:00-12:30", label: "12:00 PM – 12:30 PM" },
  { value: "12:30-13:00", label: "12:30 PM – 1:00 PM" },
  { value: "13:00-13:30", label: "1:00 PM – 1:30 PM" }
] as const;

export function deliverySlotLabel(value: string | null | undefined) {
  return DELIVERY_SLOTS.find((slot) => slot.value === value)?.label ?? value ?? "Not specified";
}
