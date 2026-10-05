import type { OrderType, PaymentMethod } from "@prisma/client";
import { getProviderForMethod } from "./registry";

/**
 * Which payment methods an order may use. Kept in one place so business rules
 * (e.g. "orders above Rs. X must be prepaid") can be added without touching
 * checkout or order creation.
 */
export type PaymentContext = {
  orderType: OrderType | "CORPORATE_PLAN";
  total: number;
};

export type PaymentMethodOption = {
  method: PaymentMethod;
  label: string;
  description: string;
  available: boolean;
  /** Why it can't be selected right now (shown to customers). */
  unavailableReason?: string;
};

const METHOD_COPY: Record<PaymentMethod, { label: string; description: string }> = {
  EASYPAISA: { label: "Easypaisa / JazzCash", description: "Pay securely from your mobile wallet." },
  JAZZCASH: { label: "JazzCash", description: "Pay securely from your JazzCash wallet." },
  COD: { label: "Cash on Delivery", description: "Pay in cash when your meal arrives." },
  CARD: { label: "Debit / Credit Card", description: "Visa or Mastercard via a secure payment page." },
  BANK_TRANSFER: { label: "Bank Transfer", description: "Transfer to our business account; we confirm on receipt." },
  INVOICE: { label: "Invoice / Monthly Billing", description: "Receive a monthly invoice for your team's meals." }
};

/**
 * Optional prepayment threshold. Unset means no high-value rule. When set,
 * orders at or above it cannot use COD (enforced in allowedMethods).
 */
function prepaymentThreshold() {
  const value = Number(process.env.PREPAYMENT_REQUIRED_ABOVE_PKR);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function requiresPrepayment(context: PaymentContext) {
  if (context.orderType !== "STANDARD") return true;
  const threshold = prepaymentThreshold();
  return threshold !== null && context.total >= threshold;
}

function allowedMethods(context: PaymentContext): PaymentMethod[] {
  if (context.orderType === "STANDARD") {
    // Easypaisa is listed first; JazzCash shares the wallet option until each
    // provider is integrated separately.
    return requiresPrepayment(context) ? ["EASYPAISA", "CARD"] : ["EASYPAISA", "COD", "CARD"];
  }

  // Corporate plans: no COD by default.
  return ["BANK_TRANSFER", "EASYPAISA", "CARD", "INVOICE"];
}

export function getPaymentMethodOptions(context: PaymentContext): PaymentMethodOption[] {
  return allowedMethods(context).map((method) => {
    const status = getProviderForMethod(method).getStatus();
    const copy = METHOD_COPY[method];
    return {
      method,
      label: copy.label,
      description: copy.description,
      available: status.state === "ready",
      unavailableReason: status.state === "ready" ? undefined : "Coming soon: we're finishing setup with our payment partner."
    };
  });
}

export function isMethodAllowed(context: PaymentContext, method: PaymentMethod) {
  return getPaymentMethodOptions(context).some((option) => option.method === method && option.available);
}
