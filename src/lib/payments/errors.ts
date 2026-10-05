export class PaymentProviderNotReadyError extends Error {
  constructor(providerName: string, detail: string) {
    super(`${providerName} is not available yet: ${detail}`);
    this.name = "PaymentProviderNotReadyError";
  }
}

export class WebhookVerificationError extends Error {
  constructor(message = "Webhook signature could not be verified") {
    super(message);
    this.name = "WebhookVerificationError";
  }
}
