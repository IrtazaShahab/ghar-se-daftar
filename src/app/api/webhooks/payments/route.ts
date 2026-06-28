import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const signature = request.headers.get("x-webhook-signature");

  if (!signature || signature !== process.env.PAYMENT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const payload = await request.json();

  // TODO: verify provider-specific signature, idempotency key, payment status, and update Payment/Subscription.
  return NextResponse.json({ received: true, event: payload?.event ?? "unknown" });
}
