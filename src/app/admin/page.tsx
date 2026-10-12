import Link from "next/link";
import { AlertCircle, Banknote, Bell, Building2, CheckCircle2, ChefHat, ClipboardCheck, Package, ShoppingBag, Smartphone, Truck, TrendingUp, XCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { MetricCard, PageHeader, TableShell, Td, Th, EmptyRow } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { PAYMENT_METHOD_LABELS, formatDateTime, formatRs } from "@/lib/orders/format";
import { startOfPktDay } from "@/lib/orders/schedule";
import { getAdminKpis } from "@/lib/orders/dashboard-queries";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const today = startOfPktDay();

  // 3 queries: all KPIs in one statement, plus the two short lists.
  const [kpis, recentOrders, feed] = await Promise.all([
    getAdminKpis(today),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, customerName: true, totalAmount: true, paymentMethod: true, paymentStatus: true, status: true, createdAt: true }
    }),
    prisma.notification.findMany({ where: { audience: "ADMIN", channel: "IN_APP" }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Admin dashboard" description="Live operations from the database. Figures for “today” use Pakistan time." />

      <section aria-labelledby="orders-heading" className="space-y-4">
        <h2 id="orders-heading" className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Orders</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Today's orders" value={kpis.todayOrders} hint={`${formatRs(kpis.todayValue)} ordered`} icon={ShoppingBag} href="/admin/orders?range=today" />
          <MetricCard label="Pending" value={kpis.pending} hint="Awaiting confirmation" icon={AlertCircle} tone="warn" href="/admin/orders?status=PENDING" />
          <MetricCard label="Confirmed" value={kpis.confirmed} icon={ClipboardCheck} href="/admin/orders?status=CONFIRMED" />
          <MetricCard label="Preparing" value={kpis.preparing} icon={ChefHat} href="/admin/orders?status=PREPARING" />
          <MetricCard label="Ready" value={kpis.ready} hint="Waiting for pickup" icon={Package} href="/admin/orders?status=READY" />
          <MetricCard label="Out for delivery" value={kpis.outForDelivery} icon={Truck} href="/admin/orders?status=OUT_FOR_DELIVERY" />
          <MetricCard label="Delivered today" value={kpis.deliveredToday} icon={CheckCircle2} tone="good" href="/admin/orders?status=DELIVERED" />
          <MetricCard label="Cancelled today" value={kpis.cancelledToday} icon={XCircle} tone="bad" href="/admin/orders?status=CANCELLED" />
        </div>
      </section>

      <section aria-labelledby="money-heading" className="space-y-4">
        <h2 id="money-heading" className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Payments &amp; requests</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Today's revenue" value={formatRs(kpis.revenueToday)} hint="Payments received today" icon={TrendingUp} tone="good" href="/admin/payments?status=PAID" />
          <MetricCard label="Online payments today" value={formatRs(kpis.onlineToday)} hint={`${kpis.onlineCount} verified payment${kpis.onlineCount === 1 ? "" : "s"}`} icon={Smartphone} href="/admin/payments?kind=online" />
          <MetricCard label="COD to collect" value={formatRs(kpis.codPendingAmount)} hint={`${kpis.codPendingCount} open COD order${kpis.codPendingCount === 1 ? "" : "s"}`} icon={Banknote} tone="warn" href="/admin/payments?method=COD&status=PENDING" />
          <MetricCard label="New corporate requests" value={kpis.corporateNew} icon={Building2} tone={kpis.corporateNew > 0 ? "warn" : "primary"} href="/admin/corporate?status=NEW" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-primary hover:underline">View all</Link>
          </div>
          <TableShell>
            <thead>
              <tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? <EmptyRow colSpan={5}>No orders yet. New orders appear here as soon as they are placed.</EmptyRow> : null}
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/60">
                  <Td>
                    <Link href={`/admin/orders/${order.id}`} className="font-bold text-primary hover:underline">{order.orderNumber}</Link>
                    <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                  </Td>
                  <Td>{order.customerName}</Td>
                  <Td className="font-semibold">{formatRs(order.totalAmount)}</Td>
                  <Td>
                    <p className="text-xs text-muted">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </Td>
                  <Td><OrderStatusBadge status={order.status} /></Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>

        <Panel>
          <PanelTitle icon={Bell}>Activity</PanelTitle>
          {feed.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {feed.map((item) => (
                <li key={item.id} className="py-3 text-sm first:pt-0">
                  {item.orderId ? (
                    <Link href={`/admin/orders/${item.orderId}`} className="font-bold hover:text-primary">{item.subject}</Link>
                  ) : item.corporateRequestId ? (
                    <Link href={`/admin/corporate/${item.corporateRequestId}`} className="font-bold hover:text-primary">{item.subject}</Link>
                  ) : (
                    <p className="font-bold">{item.subject}</p>
                  )}
                  {item.body ? <p className="text-xs text-muted wrap-anywhere">{item.body}</p> : null}
                  <p className="mt-0.5 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
