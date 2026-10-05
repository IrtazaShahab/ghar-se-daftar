import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getProviderById } from "@/lib/payments/registry";
import { applyVerifiedPayment } from "@/lib/payments/service";

export const dynamic = "force-dynamic";

/**
 * Where a provider sends the customer's browser after checkout:
 * GET /api/payments/return/<provider>?payment=<paymentId>
 *
 * The query string is NOT treated as proof of payment. We ask the provider for
 * the transaction's real state server-side, apply that, then show the order.
 */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await params;
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("payment");
  const provider = getProviderById(providerId);

  const payment = paymentId
    ? await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, provider: true, providerReference: true, providerTransactionId: true, order: { select: { orderNumber: true } } }
      })
    : null;

  if (!provider || provider.offline || !payment || payment.provider !== provider.id || !payment.order) {
    return NextResponse.redirect(new URL("/dashboard/customer/orders", url.origin));
  }

  const destination = new URL(`/orders/${payment.order.orderNumber}`, url.origin);

  try {
    const verified = await provider.verifyPayment({
      paymentId: payment.id,
      providerReference: payment.providerReference,
      providerTransactionId: payment.providerTransactionId
    });
    await applyVerifiedPayment(payment.id, verified);
  } catch (error) {
    // The webhook may still confirm the payment; the order page shows the live state.
    console.error(`Payment return verification (${provider.id}) failed:`, error instanceof Error ? error.message : error);
    destination.searchParams.set("payment", "verifying");
  }

  return NextResponse.redirect(destination);
}
