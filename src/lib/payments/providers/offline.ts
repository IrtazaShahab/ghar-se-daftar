import type { PaymentMethod } from "@prisma/client";
import type { PaymentProvider } from "../types";
import { PaymentProviderNotReadyError } from "../errors";

/**
 * Payments settled outside the app. Nothing is charged online; an admin records
 * the collection (cash handed to the rider, bank transfer received, invoice paid)
 * from /admin/payments, which is the only way these become PAID.
 */
function createOfflineProvider(id: string, displayName: string, methods: readonly PaymentMethod[]): PaymentProvider {
  const notOnline = () => {
    throw new PaymentProviderNotReadyError(displayName, "offline payments are recorded by an admin, not verified online");
  };

  return {
    id,
    displayName,
    methods,
    offline: true,
    getStatus: () => ({ state: "ready" }),
    initializePayment: async () => ({ kind: "offline" }),
    verifyPayment: async () => notOnline(),
    handleWebhook: async () => notOnline(),
    refundPayment: async () => notOnline()
  };
}

export const cashOnDeliveryProvider = createOfflineProvider("cod", "Cash on Delivery", ["COD"]);
export const manualProvider = createOfflineProvider("manual", "Bank transfer / Invoice", ["BANK_TRANSFER", "INVOICE"]);
