import Link from "next/link";
import { Bell, CheckCircle2, ChefHat, ClipboardCheck, Package, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireChefPage } from "@/lib/auth/guards";
import { getChefOrders, getChefTabCounts } from "@/lib/orders/chef-queries";
import { MetricCard, PageHeader } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";
import { AutoRefresh } from "@/components/orders/auto-refresh";
import { ChefOrderCard } from "@/components/chef/chef-order-card";
import { ChefInactiveNotice } from "@/components/chef/inactive-notice";
import { formatDateTime } from "@/lib/orders/format";

export const metadata = { title: "Kitchen" };

export default async function ChefHomePage() {
  const { user, chef } = await requireChefPage();
  if (!chef) return <ChefInactiveNotice />;

  const [counts, newOrders, notifications] = await Promise.all([
    getChefTabCounts(chef.id),
    getChefOrders(chef.id, "new"),
    prisma.notification.findMany({ where: { userId: user.id, audience: "CHEF" }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={30_000} />
      <PageHeader title={`Salaam, ${chef.displayName}`} description={`${chef.kitchens.map((kitchen) => kitchen.name).join(", ") || "Your kitchen"} · orders assigned to you only.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="New" value={counts.new} hint="Waiting for you to accept" icon={Sparkles} tone={counts.new > 0 ? "warn" : "primary"} href="/chef/orders?tab=new" />
        <MetricCard label="Accepted" value={counts.accepted} icon={ClipboardCheck} href="/chef/orders?tab=accepted" />
        <MetricCard label="Preparing" value={counts.preparing} icon={ChefHat} href="/chef/orders?tab=preparing" />
        <MetricCard label="Ready" value={counts.ready} icon={Package} href="/chef/orders?tab=ready" />
        <MetricCard label="Completed" value={counts.completed} icon={CheckCircle2} tone="good" href="/chef/orders?tab=completed" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">New orders</h2>
            <Link href="/chef/orders" className="text-sm font-bold text-primary hover:underline">All orders</Link>
          </div>
          {newOrders.length === 0 ? (
            <Panel className="py-10 text-center text-sm text-muted">No new orders right now. New assignments appear here automatically.</Panel>
          ) : (
            newOrders.map((order) => <ChefOrderCard key={order.id} order={order} />)
          )}
        </section>

        <Panel className="h-fit">
          <PanelTitle icon={Bell}>Updates</PanelTitle>
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No updates yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((item) => (
                <li key={item.id} className="py-3 text-sm first:pt-0">
                  {item.orderId ? <Link href={`/chef/orders/${item.orderId}`} className="font-bold hover:text-primary">{item.subject}</Link> : <p className="font-bold">{item.subject}</p>}
                  <p className="text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
