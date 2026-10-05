import type { PaymentMethod } from "@prisma/client";
import type { PaymentProvider, ProviderStatus } from "../types";
import { PaymentProviderNotReadyError } from "../errors";

/**
 * Online provider adapters: Easypaisa, JazzCash and a card gateway.
 *
 * These are deliberately in a "configuration required" state. Nothing here
 * talks to a real gateway yet, and nothing ever returns a successful payment.
 * To go live with one provider:
 *   1. Obtain merchant credentials + the provider's integration guide.
 *   2. Set the env vars listed in `requiredEnv` (server-only, never NEXT_PUBLIC_*).
 *   3. Implement initializePayment / verifyPayment / handleWebhook / refundPayment
 *      against the provider's documented API (use assertValidHmacSignature or the
 *      provider's own hash scheme for webhooks), then set `implemented: true`.
 * Checkout offers a method only when its provider reports { state: "ready" }.
 */
type OnlineProviderConfig = {
  id: string;
  displayName: string;
  methods: readonly PaymentMethod[];
  requiredEnv: readonly string[];
  /** Flip to true only once the real API integration above is written and tested. */
  implemented: boolean;
};

function missingEnv(names: readonly string[]) {
  return names.filter((name) => !process.env[name]?.trim());
}

function createOnlineProvider(config: OnlineProviderConfig): PaymentProvider {
  const getStatus = (): ProviderStatus => {
    const missing = missingEnv(config.requiredEnv);
    if (missing.length > 0) {
      return {
        state: "configuration_required",
        missingEnv: missing,
        note: `${config.displayName} needs merchant credentials before it can accept payments.`
      };
    }
    if (!config.implemented) {
      return {
        state: "integration_pending",
        note: `${config.displayName} credentials are set, but the provider API integration has not been built yet.`
      };
    }
    return { state: "ready" };
  };

  const notReady = (): never => {
    const status = getStatus();
    const detail = status.state === "configuration_required"
      ? `missing ${status.missingEnv.join(", ")}`
      : status.state === "integration_pending"
        ? "provider API integration pending"
        : "not implemented";
    throw new PaymentProviderNotReadyError(config.displayName, detail);
  };

  return {
    id: config.id,
    displayName: config.displayName,
    methods: config.methods,
    offline: false,
    getStatus,
    initializePayment: async () => notReady(),
    verifyPayment: async () => notReady(),
    handleWebhook: async () => notReady(),
    refundPayment: async () => notReady()
  };
}

export const easypaisaProvider = createOnlineProvider({
  id: "easypaisa",
  displayName: "Easypaisa",
  methods: ["EASYPAISA"],
  requiredEnv: ["EASYPAISA_STORE_ID", "EASYPAISA_HASH_KEY", "EASYPAISA_API_BASE_URL"],
  implemented: false
});

export const jazzcashProvider = createOnlineProvider({
  id: "jazzcash",
  displayName: "JazzCash",
  methods: ["JAZZCASH"],
  requiredEnv: ["JAZZCASH_MERCHANT_ID", "JAZZCASH_PASSWORD", "JAZZCASH_INTEGRITY_SALT", "JAZZCASH_API_BASE_URL"],
  implemented: false
});

export const cardGatewayProvider = createOnlineProvider({
  id: "card",
  displayName: "Debit / Credit Card",
  methods: ["CARD"],
  requiredEnv: ["CARD_GATEWAY_MERCHANT_ID", "CARD_GATEWAY_API_KEY", "CARD_GATEWAY_WEBHOOK_SECRET", "CARD_GATEWAY_API_BASE_URL"],
  implemented: false
});
