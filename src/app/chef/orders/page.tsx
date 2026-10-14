import { requireChefPage } from "@/lib/auth/guards";
import { CHEF_TABS, CHEF_TAB_LABELS, getChefBoard, type ChefTab } from "@/lib/orders/chef-queries";
import { PageHeader } from "@/components/admin/ui";
import { Panel } from "@/components/orders/order-details";
import { AutoRefresh } from "@/components/orders/auto-refresh";
import { ChefOrderCard } from "@/components/chef/chef-order-card";
import { ChefInactiveNotice } from "@/components/chef/inactive-notice";
import { LocalTabs } from "@/components/ui/local-tabs";

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
  const initial: ChefTab = CHEF_TABS.find((value) => value === requested) ?? "new";
  // All tabs in one query; switching tabs is local and instant.
  const board = await getChefBoard(chef.id);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30_000} />
      <PageHeader title="Orders" description="Accept new orders, start preparation and mark them ready for pickup." />

      <LocalTabs
        label="Order status"
        initial={initial}
        tabs={CHEF_TABS.map((tab) => ({
          key: tab,
          label: CHEF_TAB_LABELS[tab],
          count: board[tab].length,
          content:
            board[tab].length === 0 ? (
              <Panel className="py-12 text-center text-sm text-muted">{EMPTY[tab]}</Panel>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {board[tab].map((order) => <ChefOrderCard key={order.id} order={order} />)}
              </div>
            )
        }))}
      />
    </div>
  );
}
