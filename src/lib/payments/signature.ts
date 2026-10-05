import { createHmac, timingSafeEqual } from "crypto";
import { WebhookVerificationError } from "./errors";

/**
 * Constant-time HMAC-SHA256 check for provider webhooks that sign the raw body.
 * Providers differ in encoding (hex/base64) and header name, so adapters pass both.
 */
export function assertValidHmacSignature({
  rawBody,
  signature,
  secret,
  encoding = "hex"
}: {
  rawBody: string;
  signature: string | null;
  secret: string;
  encoding?: "hex" | "base64";
}) {
  if (!signature || !secret) throw new WebhookVerificationError();

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest(encoding);
  const received = signature.trim().replace(/^sha256=/i, "");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new WebhookVerificationError();
  }
}
