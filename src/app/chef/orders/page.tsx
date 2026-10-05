import Link from "next/link";
import { requireChefPage } from "@/lib/auth/guards";
import { CHEF_TABS, CHEF_TAB_LABELS, getChefOrders, getChefTabCounts, type ChefTab } from "@/lib/orders/chef-queries";
import { PageHeader } from "@/components/admin/ui";
import { Panel } from "@/components/orders/order-details";
import { AutoRefresh } from "@/components/orders/auto-refresh";
import { ChefOrderCard } from "@/components/chef/chef-order-card";
import { ChefInactiveNotice } from "@/components/chef/inactive-notice";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kitchen orders" };

const EMPTY: Record<ChefTab, string> = {
  new: "No new orders waiting for you.",
  accepted: "No accepted orders waiting to be started.",
  preparing: "Nothing is being prepared right now.",
  ready: "No orders waiting for pickup.",
  completed: "Completed orders will appear here."
};

export default async function ChefOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { chef } = await requireChefPage("/chef/orders");
  if (!chef) return <ChefInactiveNotice />;

  const { tab: requested } = await searchParams;
  const tab: ChefTab = CHEF_TABS.find((value) => value === requested) ?? "new";
  const [orders, counts] = await Promise.all([getChefOrders(chef.id, tab), getChefTabCounts(chef.id)]);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30_000} />
      <PageHeader title="Orders" description="Accept new orders, start preparation and mark them ready for pickup." />

      <nav aria-label="Order status" className="menu-tabs-scroll overflow-x-auto">
        <div className="flex min-w-max gap-2 rounded-[22px] border border-border/80 bg-white/55 p-2">
          {CHEF_TABS.map((value) => (
            <Link
              key={value}
              href={`/chef/orders?tab=${value}`}
              aria-current={tab === value ? "page" : undefined}
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold transition",
                tab === value ? "bg-primary text-white shadow-lg shadow-primary/15" : "text-primary/75 hover:bg-white"
              )}
            >
              {CHEF_TAB_LABELS[value]}
              <span className={cn("rounded-full px-2 py-0.5 text-xs", tab === value ? "bg-white/20" : "bg-primary/10")}>{counts[value]}</span>
            </Link>
          ))}
        </div>
      </nav>

      {orders.length === 0 ? (
        <Panel className="py-12 text-center text-sm text-muted">{EMPTY[tab]}</Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => <ChefOrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
