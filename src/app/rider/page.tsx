import Link from "next/link";
import { Bike, CheckCircle2, PackageCheck, Sparkles } from "lucide-react";
import { requireRiderPage } from "@/lib/auth/guards";
import { getRiderDeliveries } from "@/lib/delivery/queries";
import { MetricCard, PageHeader } from "@/components/admin/ui";
import { Panel } from "@/components/orders/order-details";
import { AutoRefresh } from "@/components/orders/auto-refresh";
import { RiderDeliveryCard } from "@/components/rider/rider-delivery-card";
import { RiderInactiveNotice } from "@/components/rider/inactive-notice";

export const metadata = { title: "Deliveries" };

export default async function RiderHomePage() {
  const { rider } = await requireRiderPage();
  if (!rider) return <RiderInactiveNotice />;

  const { active, completed } = await getRiderDeliveries(rider.id);
  const waiting = active.filter((delivery) => delivery.status === "ASSIGNED").length;
  const onTheWay = active.filter((delivery) => delivery.status === "PICKED_UP").length;

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={30_000} />
      <PageHeader title={`Salaam, ${rider.displayName}`} description="Deliveries assigned to you. Accept, collect from the kitchen, and deliver." />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="New" value={waiting} hint="Waiting for you to accept" icon={Sparkles} tone={waiting > 0 ? "warn" : "primary"} href="/rider/deliveries?tab=active" />
        <MetricCard label="On the way" value={onTheWay} icon={Bike} href="/rider/deliveries?tab=active" />
        <MetricCard label="Completed (30 days)" value={completed.length} icon={CheckCircle2} tone="good" href="/rider/deliveries?tab=completed" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Active deliveries</h2>
          <Link href="/rider/deliveries" className="text-sm font-bold text-primary hover:underline">All deliveries</Link>
        </div>
        {active.length === 0 ? (
          <Panel className="py-10 text-center text-sm text-muted">
            <PackageCheck className="mx-auto mb-3 size-8 text-primary" aria-hidden="true" />
            No deliveries right now. New assignments appear here automatically.
          </Panel>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map((delivery) => <RiderDeliveryCard key={delivery.orderId} delivery={delivery} />)}
          </div>
        )}
      </section>
    </div>
  );
}
