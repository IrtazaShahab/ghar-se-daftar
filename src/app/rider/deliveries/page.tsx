import { requireRiderPage } from "@/lib/auth/guards";
import { getRiderDeliveries } from "@/lib/delivery/queries";
import { PageHeader } from "@/components/admin/ui";
import { Panel } from "@/components/orders/order-details";
import { AutoRefresh } from "@/components/orders/auto-refresh";
import { LocalTabs } from "@/components/ui/local-tabs";
import { RiderDeliveryCard } from "@/components/rider/rider-delivery-card";
import { RiderInactiveNotice } from "@/components/rider/inactive-notice";

export const metadata = { title: "My deliveries" };

export default async function RiderDeliveriesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { rider } = await requireRiderPage("/rider/deliveries");
  if (!rider) return <RiderInactiveNotice />;

  const { tab } = await searchParams;
  const { active, completed } = await getRiderDeliveries(rider.id);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30_000} />
      <PageHeader title="Deliveries" description="Only deliveries assigned to you are shown here." />
      <LocalTabs
        label="Delivery status"
        initial={tab === "completed" ? "completed" : "active"}
        tabs={[
          {
            key: "active",
            label: "Active",
            count: active.length,
            content:
              active.length === 0 ? (
                <Panel className="py-12 text-center text-sm text-muted">No active deliveries.</Panel>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">{active.map((delivery) => <RiderDeliveryCard key={delivery.orderId} delivery={delivery} />)}</div>
              )
          },
          {
            key: "completed",
            label: "Completed",
            count: completed.length,
            content:
              completed.length === 0 ? (
                <Panel className="py-12 text-center text-sm text-muted">Completed deliveries from the last 30 days appear here.</Panel>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">{completed.map((delivery) => <RiderDeliveryCard key={delivery.orderId} delivery={delivery} />)}</div>
              )
          }
        ]}
      />
    </div>
  );
}
