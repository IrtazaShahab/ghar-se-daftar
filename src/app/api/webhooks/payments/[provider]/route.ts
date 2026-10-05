import { NextResponse } from "next/server";
import { getProviderById } from "@/lib/payments/registry";
import { processPaymentWebhook } from "@/lib/payments/service";

export const dynamic = "force-dynamic";

/**
 * Server-to-server payment notifications: POST /api/webhooks/payments/<provider>.
 * The provider adapter verifies the signature over the raw body; events are
 * stored once per (provider, eventId) so retried deliveries are harmless.
 */
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await params;
  const provider = getProviderById(providerId);

  if (!provider || provider.offline) {
    return NextResponse.json({ error: "Unknown payment provider" }, { status: 404 });
  }

  if (provider.getStatus().state !== "ready") {
    // Not live yet: reject so nothing is ever marked paid by an unverified call.
    return NextResponse.json({ error: "Payment provider is not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const outcome = await processPaymentWebhook(provider, { headers: request.headers, rawBody });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  return NextResponse.json({ received: true, duplicate: outcome.duplicate });
}
