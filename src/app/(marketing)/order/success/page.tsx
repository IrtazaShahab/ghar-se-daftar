import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { DeliverySummary, OrderHeader, OrderItemsTable, Panel, PanelTitle, PaymentSummary } from "@/components/orders/order-details";
import { redirectOperationalStaff, requireUserPage } from "@/lib/auth/guards";
import { getCustomerOrder } from "@/lib/orders/queries";
import { ORDER_STATUS_DESCRIPTIONS } from "@/lib/orders/status";
import { generateOrderConfirmationMessage } from "@/lib/order";
import { isEmailConfigured } from "@/lib/email/transport";
import { AlertTriangle, Check, CreditCard, MapPin, ShoppingBag } from "lucide-react";

export const metadata = {
    title: "Order Received",
    description: "Your Ghar Se Daftar order has been received."
};

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; payment?: string }> }) {
    const { order: orderNumber, payment } = await searchParams;
    const user = await requireUserPage(orderNumber ? `/order/success?order=${encodeURIComponent(orderNumber)}` : "/dashboard/customer/orders");
    redirectOperationalStaff(user);
    const order = orderNumber ? await getCustomerOrder(orderNumber, user.id) : null;

    return (
        <>
            <MarketingNav />
            <main className="container-gsd py-12 md:py-20">
                {!order ? (
                    <Panel className="mx-auto max-w-md text-center">
                        <ShoppingBag className="mx-auto size-10 text-primary" aria-hidden="true" />
                        <h1 className="mt-4 font-serif text-3xl font-semibold">Order not found</h1>
                        <p className="mt-2 text-muted">We couldn&rsquo;t find that order on your account.</p>
                        <ButtonLink href="/dashboard/customer/orders" className="mt-6 w-full">View my orders</ButtonLink>
                    </Panel>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-6">
                        <div className="text-center">
                            <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
                                <Check className="size-10 stroke-[3]" aria-hidden="true" />
                            </span>
                            <h1 className="mt-6 text-balance font-serif text-4xl font-semibold md:text-5xl">
                                {order.status === "PENDING" ? "Order received" : "Order confirmed"}
                            </h1>
                            <p className="mx-auto mt-3 max-w-xl text-muted">
                                Thank you, {order.customerName.split(" ")[0]}! {ORDER_STATUS_DESCRIPTIONS[order.status]}
                                {isEmailConfigured() ? ` A confirmation email is on its way to ${order.customerEmail}.` : ""}
                            </p>
                        </div>

                        {payment === "failed" ? (
                            <div role="alert" className="flex items-start gap-3 rounded-[20px] border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                Your order is saved, but the online payment couldn&rsquo;t be started. Our team will contact you to arrange payment.
                            </div>
                        ) : null}

                        <Panel>
                            <OrderHeader order={order} />
                        </Panel>

                        <Panel>
                            <PanelTitle icon={ShoppingBag}>Items</PanelTitle>
                            <OrderItemsTable order={order} />
                        </Panel>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Panel>
                                <PanelTitle icon={CreditCard}>Payment</PanelTitle>
                                <PaymentSummary order={order} />
                            </Panel>
                            <Panel>
                                <PanelTitle icon={MapPin}>Delivery</PanelTitle>
                                <DeliverySummary order={order} />
                            </Panel>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <ButtonLink href={`/orders/${order.orderNumber}`} className="w-full">Track Order</ButtonLink>
                            <ButtonLink href="/menu" variant="secondary" className="w-full">Browse more meals</ButtonLink>
                        </div>
                        <WhatsAppButton message={generateOrderConfirmationMessage(order.orderNumber)} variant="inline" className="w-full" />
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
