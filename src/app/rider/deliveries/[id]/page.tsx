import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChefHat, ClipboardList, MapPin, Phone, ShoppingBag } from "lucide-react";
import { requireRiderPage } from "@/lib/auth/guards";
import { getRiderDelivery } from "@/lib/delivery/queries";
import { deliverySlotLabel, formatDateTime, formatDay } from "@/lib/orders/format";
import { PageHeader } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";
import { LiveDeliveryBadge, OptimisticStatusProvider } from "@/components/orders/optimistic-status";
import { DirectionsLink, RiderCodNotice, RiderLiveLocation, RiderNextAction } from "@/components/rider/rider-delivery-card";
import { RiderInactiveNotice } from "@/components/rider/inactive-notice";

export const metadata = { title: "Delivery" };

export default async function RiderDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rider } = await requireRiderPage(`/rider/deliveries/${id}`);
  if (!rider) return <RiderInactiveNotice />;

  // Scoped to this rider: another rider's delivery id returns 404.
  const delivery = await getRiderDelivery(rider.id, id);
  if (!delivery) notFound();

  const meals = delivery.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <OptimisticStatusProvider>
      <div className="space-y-6">
        <Link href="/rider/deliveries" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-75">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My deliveries
        </Link>

        <PageHeader
          title={delivery.orderNumber}
          description={`${delivery.customerFirstName}${delivery.companyName ? ` · ${delivery.companyName}` : ""} · ${formatDay(delivery.deliveryDate)}, ${deliverySlotLabel(delivery.deliverySlot)}`}
          actions={<LiveDeliveryBadge status={delivery.status} />}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            {delivery.pickup ? (
              <Panel>
                <PanelTitle icon={ChefHat}>Pickup</PanelTitle>
                <dl className="grid gap-3 text-sm">
                  <div><dt className="text-xs text-muted">Kitchen</dt><dd className="break-words font-semibold">{delivery.pickup.kitchenName ?? "Kitchen"}{delivery.pickup.area ? `, ${delivery.pickup.area}` : ""}</dd></div>
                  {delivery.pickup.address ? <div><dt className="text-xs text-muted">Address</dt><dd className="break-words font-semibold">{delivery.pickup.address}</dd></div> : null}
                  {delivery.pickup.chefName ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><dt className="text-xs text-muted">Chef</dt><dd className="font-semibold">{delivery.pickup.chefName}</dd></div>
                      {delivery.pickup.chefPhone ? (
                        <a href={`tel:${delivery.pickup.chefPhone}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-bold text-primary hover:bg-card">
                          <Phone className="size-4" aria-hidden="true" />
                          Call kitchen
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </dl>
              </Panel>
            ) : null}

            <Panel>
              <PanelTitle icon={MapPin}>Drop-off</PanelTitle>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Address</dt>
                  <dd className="break-words font-semibold">
                    {delivery.companyName ? <>{delivery.companyName}<br /></> : null}
                    {delivery.deliveryAddress ? <>{delivery.deliveryAddress}<br /></> : null}
                    {delivery.deliveryArea}, {delivery.deliveryCity}
                  </dd>
                </div>
                {delivery.instructions ? <div><dt className="text-xs text-muted">Customer instructions</dt><dd className="break-words font-semibold">{delivery.instructions}</dd></div> : null}
              </dl>
              {delivery.active ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <DirectionsLink delivery={delivery} />
                  {delivery.customerPhone ? (
                    <a href={`tel:${delivery.customerPhone}`} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-white hover:bg-[#183f28]">
                      <Phone className="size-4" aria-hidden="true" />
                      Call {delivery.customerFirstName}
                    </a>
                  ) : null}
                </div>
              ) : null}
              {delivery.active && !delivery.customerPhone ? <p className="mt-3 text-xs text-muted">The customer&rsquo;s number appears once you pick up the order.</p> : null}
            </Panel>

            <Panel>
              <PanelTitle icon={ShoppingBag}>Package · {meals} meal{meals === 1 ? "" : "s"}</PanelTitle>
              <ul className="divide-y divide-border text-sm">
                {delivery.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-2 first:pt-0">
                    <span className="min-w-0 break-words font-semibold">{item.itemName}</span>
                    <span className="font-bold">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel>
              <PanelTitle icon={ClipboardList}>Next step</PanelTitle>
              <div className="grid gap-3">
                <RiderCodNotice delivery={delivery} />
                <RiderNextAction delivery={delivery} />
                {!delivery.active ? (
                  <p className="text-sm text-muted">
                    {delivery.status === "DELIVERED" ? `Delivered${delivery.deliveredAt ? ` ${formatDateTime(delivery.deliveredAt)}` : ""}. Thank you!` : "This delivery was cancelled."}
                  </p>
                ) : null}
              </div>
            </Panel>

            <RiderLiveLocation delivery={delivery} />
          </div>
        </div>
      </div>
    </OptimisticStatusProvider>
  );
}
