import Link from "next/link";
import { Banknote, ChefHat, Clock, LocateFixed, MapPin, Navigation, Phone, StickyNote } from "lucide-react";
import type { RiderDeliveryView } from "@/lib/delivery/queries";
import { RIDER_STATUS_LABELS } from "@/lib/delivery/status";
import { addressDirectionsLink, directionsLink } from "@/lib/delivery/geo";
import { deliverySlotLabel, formatDateTime, formatDay, formatRs } from "@/lib/orders/format";
import { riderAcceptDelivery, riderMarkDelivered, riderPickUp } from "@/app/actions/rider";
import { ActionButton } from "@/components/admin/action-controls";
import { LiveDeliveryBadge, OptimisticStatusProvider } from "@/components/orders/optimistic-status";
import { DeliveryStatusBadge } from "@/components/orders/delivery-badges";
import { LocationSharing } from "./location-sharing";

/** COD amount the rider must collect at the door. */
export function RiderCodNotice({ delivery }: { delivery: Pick<RiderDeliveryView, "codToCollect"> }) {
  if (delivery.codToCollect === null) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-extrabold text-secondary">
      <Banknote className="size-3.5" aria-hidden="true" />
      Collect {formatRs(delivery.codToCollect)} cash
    </p>
  );
}

/**
 * The one step the rider can take now. The server re-checks every step
 * (assignment, delivery state and order lifecycle).
 */
export function RiderNextAction({ delivery }: { delivery: RiderDeliveryView }) {
  if (!delivery.active) return null;
  const id = delivery.orderId;

  if (delivery.status === "ASSIGNED") {
    return (
      <ActionButton action={riderAcceptDelivery.bind(null, id)} optimistic={{ deliveryStatus: "ACCEPTED" }} pendingLabel="Accepting…">
        Accept delivery
      </ActionButton>
    );
  }
  if (delivery.status === "ACCEPTED") {
    if (delivery.orderStatus !== "READY") {
      return <p className="text-sm font-semibold text-muted">Accepted. Waiting for the kitchen to mark it ready for pickup.</p>;
    }
    return (
      <ActionButton action={riderPickUp.bind(null, id)} optimistic={{ deliveryStatus: "PICKED_UP" }} pendingLabel="Updating…">
        Picked up · start delivery
      </ActionButton>
    );
  }
  if (delivery.status === "PICKED_UP") {
    if (delivery.codToCollect !== null) {
      return (
        <div className="grid gap-2">
          <ActionButton
            action={riderMarkDelivered.bind(null, id, true)}
            optimistic={{ deliveryStatus: "DELIVERED" }}
            pendingLabel="Saving…"
            confirmMessage={`Confirm you collected ${formatRs(delivery.codToCollect)} in cash?`}
          >
            Delivered · cash collected {formatRs(delivery.codToCollect)}
          </ActionButton>
          <ActionButton
            action={riderMarkDelivered.bind(null, id, false)}
            optimistic={{ deliveryStatus: "DELIVERED" }}
            variant="secondary"
            pendingLabel="Saving…"
            confirmMessage="Mark delivered without collecting the cash? The team will follow up."
          >
            Delivered · cash not collected
          </ActionButton>
        </div>
      );
    }
    return (
      <ActionButton action={riderMarkDelivered.bind(null, id, false)} optimistic={{ deliveryStatus: "DELIVERED" }} pendingLabel="Saving…">
        Mark delivered
      </ActionButton>
    );
  }
  return null;
}

/** Navigation link: exact pin when the customer chose one, otherwise the typed address. */
export function DirectionsLink({ delivery }: { delivery: Pick<RiderDeliveryView, "destination" | "deliveryAddress" | "deliveryArea" | "deliveryCity"> }) {
  const href = delivery.destination
    ? directionsLink(delivery.destination)
    : delivery.deliveryAddress
      ? addressDirectionsLink(`${delivery.deliveryAddress}, ${delivery.deliveryArea}, ${delivery.deliveryCity}`)
      : null;
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-extrabold text-primary hover:bg-card">
      <Navigation className="size-4" aria-hidden="true" />
      Directions
    </a>
  );
}

/**
 * Live-location controls while the rider is carrying the order. Rendered on the
 * cards as well as the delivery page, because riders run the whole flow
 * (accept → pick up → delivered) from the cards. Unmounts, and so stops
 * watching GPS, as soon as the delivery is no longer out for delivery.
 */
export function RiderLiveLocation({ delivery }: { delivery: Pick<RiderDeliveryView, "active" | "status" | "orderId" | "sharing"> }) {
  if (!delivery.active || delivery.status !== "PICKED_UP") return null;
  return (
    <section aria-label="Live location" className="rounded-2xl border border-border bg-white/70 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
        <LocateFixed className="size-4" aria-hidden="true" />
        Live location
      </h3>
      <LocationSharing orderId={delivery.orderId} initiallySharing={delivery.sharing} />
    </section>
  );
}

export function RiderDeliveryCard({ delivery }: { delivery: RiderDeliveryView }) {
  const meals = delivery.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <OptimisticStatusProvider>
      <article className="glass-card min-w-0 rounded-[24px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/rider/deliveries/${delivery.orderId}`} className="text-lg font-extrabold text-primary hover:underline">
              {delivery.orderNumber}
            </Link>
            <p className="text-sm text-muted">
              {delivery.customerFirstName}
              {delivery.companyName ? ` · ${delivery.companyName}` : ""} · {meals} meal{meals === 1 ? "" : "s"}
            </p>
          </div>
          {delivery.active ? (
            <LiveDeliveryBadge status={delivery.status} />
          ) : (
            <DeliveryStatusBadge status={delivery.status} label={RIDER_STATUS_LABELS[delivery.status]} />
          )}
        </div>

        <dl className="mt-4 grid gap-2 text-sm">
          {delivery.pickup ? (
            <div className="flex min-w-0 items-start gap-2">
              <ChefHat className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="sr-only">Pickup</dt>
                <dd className="break-words">
                  <strong>Pickup:</strong> {delivery.pickup.kitchenName ?? "Kitchen"}
                  {delivery.pickup.area ? `, ${delivery.pickup.area}` : ""}
                  {delivery.pickup.address ? <span className="block text-xs text-muted">{delivery.pickup.address}</span> : null}
                </dd>
              </div>
            </div>
          ) : null}
          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="sr-only">Drop-off</dt>
              <dd className="break-words">
                <strong>Drop-off:</strong> {delivery.deliveryAddress ? `${delivery.deliveryAddress}, ` : ""}
                {delivery.deliveryArea}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {formatDay(delivery.deliveryDate)} · {deliverySlotLabel(delivery.deliverySlot)}
          </div>
          {delivery.instructions ? (
            <p className="flex min-w-0 items-start gap-2 rounded-2xl bg-primary/5 p-3">
              <StickyNote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 break-words">{delivery.instructions}</span>
            </p>
          ) : null}
          {!delivery.active && delivery.deliveredAt ? <p className="text-xs text-muted">Delivered {formatDateTime(delivery.deliveredAt)}</p> : null}
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <RiderCodNotice delivery={delivery} />
          <div className="flex flex-wrap items-center gap-2">
            {delivery.customerPhone ? (
              <a href={`tel:${delivery.customerPhone}`} className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-extrabold text-primary hover:bg-card">
                <Phone className="size-4" aria-hidden="true" />
                Call
              </a>
            ) : null}
            {delivery.active ? <RiderNextAction delivery={delivery} /> : null}
          </div>
        </div>

        <div className="mt-4 empty:hidden">
          <RiderLiveLocation delivery={delivery} />
        </div>
      </article>
    </OptimisticStatusProvider>
  );
}
