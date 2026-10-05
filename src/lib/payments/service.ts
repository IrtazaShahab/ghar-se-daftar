import { Prisma, type PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { PaymentProvider, VerifiedPayment } from "./types";
import { WebhookVerificationError } from "./errors";
import { notifyVerifiedPayment } from "@/lib/notifications/orders";

/**
 * Applies a provider-verified result to a payment. This is the only code path
 * that marks an online payment PAID, and it is idempotent: re-applying the same
 * result (duplicate webhook, return URL after webhook) changes nothing.
 */
export async function applyVerifiedPayment(paymentId: string, verified: VerifiedPayment) {
  const updated = await applyVerifiedPaymentToDatabase(paymentId, verified);
  // Emails run only after the database commit and never throw.
  if (updated.status === "PAID" && updated.orderId) await notifyVerifiedPayment(updated.orderId);
  return updated;
}

async function applyVerifiedPaymentToDatabase(paymentId: string, verified: VerifiedPayment) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { id: true, status: true, totalAmount: true } } }
    });
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    // Never downgrade a settled payment, and never treat a mismatched amount as paid.
    if (payment.status === "PAID" || payment.status === "REFUNDED") return payment;

    let status: PaymentStatus = verified.status === "paid" ? "PAID" : verified.status === "failed" ? "FAILED" : "PROCESSING";
    let failureReason: string | null = null;
    if (status === "PAID" && (verified.amount !== payment.amount || verified.currency !== payment.currency)) {
      status = "FAILED";
      failureReason = `Amount mismatch: expected ${payment.currency} ${payment.amount}, provider reported ${verified.currency} ${verified.amount}`;
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status,
        failureReason,
        providerTransactionId: verified.providerTransactionId ?? payment.providerTransactionId,
        providerReference: verified.providerReference ?? payment.providerReference,
        paidAt: status === "PAID" ? new Date() : null,
        metadata: { lastVerification: verified.raw as Prisma.InputJsonValue }
      }
    });

    if (payment.order) {
      await tx.order.update({ where: { id: payment.order.id }, data: { paymentStatus: status } });

      // A verified online payment confirms a pending order automatically.
      if (status === "PAID" && payment.order.status === "PENDING") {
        await tx.order.update({ where: { id: payment.order.id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
        await tx.orderStatusHistory.create({
          data: { orderId: payment.order.id, fromStatus: "PENDING", toStatus: "CONFIRMED", note: `Payment verified by ${payment.provider}` }
        });
      }
    }

    return updated;
  });
}

export type WebhookOutcome =
  | { ok: true; duplicate: boolean }
  | { ok: false; status: 400 | 401 | 404; error: string };

/**
 * Verifies, de-duplicates and applies one provider webhook delivery.
 * Each (provider, eventId) is stored once; retries return `duplicate: true`.
 */
export async function processPaymentWebhook(provider: PaymentProvider, request: { headers: Headers; rawBody: string }): Promise<WebhookOutcome> {
  let result;
  try {
    result = await provider.handleWebhook(request);
  } catch (error) {
    if (error instanceof WebhookVerificationError) return { ok: false, status: 401, error: "Invalid signature" };
    console.error(`Payment webhook (${provider.id}) rejected:`, error instanceof Error ? error.message : error);
    return { ok: false, status: 400, error: "Webhook could not be processed" };
  }

  const payment = result.paymentId
    ? await prisma.payment.findUnique({ where: { id: result.paymentId }, select: { id: true, provider: true } })
    : result.providerReference
      ? await prisma.payment.findFirst({ where: { provider: provider.id, providerReference: result.providerReference }, select: { id: true, provider: true } })
      : null;

  if (!payment || payment.provider !== provider.id) {
    return { ok: false, status: 404, error: "Unknown payment" };
  }

  try {
    await prisma.paymentEvent.create({
      data: {
        provider: provider.id,
        eventId: result.eventId,
        eventType: result.eventType,
        paymentId: payment.id,
        payload: result.verified.raw as Prisma.InputJsonValue
      }
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;

    // Seen before: skip if it was fully applied, otherwise retry applying it.
    const existing = await prisma.paymentEvent.findUnique({
      where: { provider_eventId: { provider: provider.id, eventId: result.eventId } },
      select: { processedAt: true }
    });
    if (existing?.processedAt) return { ok: true, duplicate: true };
  }

  await applyVerifiedPayment(payment.id, result.verified);
  await prisma.paymentEvent.update({
    where: { provider_eventId: { provider: provider.id, eventId: result.eventId } },
    data: { processedAt: new Date() }
  });

  return { ok: true, duplicate: false };
}
