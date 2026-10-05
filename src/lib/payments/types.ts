import type { PaymentMethod } from "@prisma/client";

/**
 * Contract every payment provider implements. Online providers (Easypaisa,
 * JazzCash, card gateway) must only ever report `paid` from a response they have
 * verified with the provider (server-to-server call or signed webhook), never
 * from a browser redirect or query string.
 */
export interface PaymentProvider {
  /** Stable id stored on Payment.provider, e.g. "cod", "jazzcash". */
  readonly id: string;
  readonly displayName: string;
  readonly methods: readonly PaymentMethod[];
  /** true for methods settled outside the app (cash, bank transfer, invoice). */
  readonly offline: boolean;

  /** Current readiness, including which credentials are still missing. */
  getStatus(): ProviderStatus;

  /** Start a payment: returns where to send the customer (online) or nothing (offline). */
  initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult>;

  /** Ask the provider for the authoritative state of a transaction. */
  verifyPayment(input: VerifyPaymentInput): Promise<VerifiedPayment>;

  /** Authenticate and parse a webhook delivery. Throws if the signature is invalid. */
  handleWebhook(request: WebhookRequest): Promise<WebhookResult>;

  refundPayment(input: RefundPaymentInput): Promise<RefundResult>;
}

export type ProviderStatus =
  | { state: "ready" }
  /** The adapter exists but merchant credentials are not set. */
  | { state: "configuration_required"; missingEnv: string[]; note: string }
  /** Credentials may be set, but the provider API integration has not been built yet. */
  | { state: "integration_pending"; note: string };

export type InitializePaymentInput = {
  paymentId: string;
  orderNumber: string;
  amount: number;
  currency: "PKR";
  customer: { name: string; email: string; phone: string };
  /** Absolute URL the provider redirects the browser back to (display only, not proof). */
  returnUrl: string;
  /** Absolute URL for server-to-server notifications. */
  webhookUrl: string;
};

export type InitializePaymentResult =
  | { kind: "offline" }
  | { kind: "redirect"; redirectUrl: string; providerReference: string }
  | { kind: "form_post"; actionUrl: string; fields: Record<string, string>; providerReference: string };

export type VerifyPaymentInput = {
  paymentId: string;
  providerReference: string | null;
  providerTransactionId: string | null;
};

export type VerifiedPaymentStatus = "paid" | "failed" | "pending";

export type VerifiedPayment = {
  status: VerifiedPaymentStatus;
  amount: number;
  currency: string;
  providerTransactionId: string | null;
  providerReference: string | null;
  /** Raw provider response, stored for reconciliation. */
  raw: unknown;
};

export type WebhookRequest = {
  headers: Headers;
  /** Exact raw body; signatures are computed over these bytes. */
  rawBody: string;
};

export type WebhookResult = {
  /** Provider's unique id for this delivery; used to ignore retries. */
  eventId: string;
  eventType: string;
  /** Our Payment.id if the provider echoes it back, else looked up by reference. */
  paymentId: string | null;
  providerReference: string | null;
  verified: VerifiedPayment;
};

export type RefundPaymentInput = {
  paymentId: string;
  providerTransactionId: string;
  amount: number;
  reason: string;
};

export type RefundResult = { status: "refunded" | "pending" | "failed"; providerReference: string | null; raw: unknown };
