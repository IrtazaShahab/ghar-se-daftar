import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { AutoRefresh } from "@/components/orders/auto-refresh";
import { DeliverySummary, OrderHeader, OrderItemsTable, Panel, PanelTitle, PaymentSummary, TrackingTimeline } from "@/components/orders/order-details";
import { requireUserPage } from "@/lib/auth/guards";
import { getCustomerOrder } from "@/lib/orders/queries";
import { isTerminalStatus } from "@/lib/orders/status";
import { generateOrderConfirmationMessage } from "@/lib/order";
import { ArrowLeft, CreditCard, MapPin, Route, ShoppingBag } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }): Promise<Metadata> {
  const { orderId } = await params;
  return { title: `Track order ${decodeURIComponent(orderId).toUpperCase()}`, robots: { index: false } };
}

/**
 * Customer order tracking. `orderId` is the GSD reference; the lookup is scoped
 * to the signed-in customer, so other customers' orders are never shown.
 */
export default async function OrderTrackingPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { orderId } = await params;
  const { payment } = await searchParams;
  const orderNumber = decodeURIComponent(orderId);
  const user = await requireUserPage(`/orders/${encodeURIComponent(orderNumber)}`);
  const order = await getCustomerOrder(orderNumber, user.id);

  return (
    <>
      <MarketingNav />
      <main className="container-gsd py-10 md:py-16">
        <Link href="/dashboard/customer/orders" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-75">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My orders
        </Link>

        {!order ? (
          <Panel className="mx-auto max-w-md text-center">
            <ShoppingBag className="mx-auto size-10 text-primary" aria-hidden="true" />
            <h1 className="mt-4 font-serif text-3xl font-semibold">Order not found</h1>
            <p className="mt-2 text-muted">We couldn&rsquo;t find order {orderNumber.toUpperCase()} on your account.</p>
            <ButtonLink href="/dashboard/customer/orders" className="mt-6 w-full">View my orders</ButtonLink>
          </Panel>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {isTerminalStatus(order.status) ? null : <AutoRefresh intervalMs={30_000} />}

            <div className="min-w-0 space-y-6">
              <Panel>
                <OrderHeader order={order} />
              </Panel>

              {payment === "verifying" ? (
                <p role="status" className="rounded-[20px] bg-accent/15 p-4 text-sm font-semibold text-secondary">
                  We&rsquo;re confirming your payment with the provider. This page updates automatically.
                </p>
              ) : null}

              <Panel>
                <PanelTitle icon={Route}>Order progress</PanelTitle>
                <TrackingTimeline status={order.status} history={order.statusHistory} />
              </Panel>

              <Panel>
                <PanelTitle icon={MapPin}>Delivery</PanelTitle>
                <DeliverySummary order={order} />
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel>
                <PanelTitle icon={ShoppingBag}>Items</PanelTitle>
                <OrderItemsTable order={order} />
              </Panel>
              <Panel>
                <PanelTitle icon={CreditCard}>Payment</PanelTitle>
                <PaymentSummary order={order} />
              </Panel>
              <WhatsAppButton message={generateOrderConfirmationMessage(order.orderNumber)} variant="inline" className="w-full" />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
