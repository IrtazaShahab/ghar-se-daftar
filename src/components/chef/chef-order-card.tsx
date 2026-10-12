import Link from "next/link";
import { Banknote, Bike, Clock, MapPin, StickyNote } from "lucide-react";
import type { ChefOrder } from "@/lib/orders/chef-queries";
import { deliverySlotLabel, formatDay, formatRs } from "@/lib/orders/format";
import { chefAcceptOrder, chefMarkReady, chefStartPreparing } from "@/app/actions/chef";
import { ActionButton } from "@/components/admin/action-controls";
import { LiveAssignmentBadge, LiveOrderBadge, OptimisticStatusProvider } from "@/components/orders/optimistic-status";
import { formatDateTime } from "@/lib/orders/format";

/** The COD line chefs/riders may see: amount only, no payment records. */
export function CodNotice({ order }: { order: Pick<ChefOrder, "paymentMethod" | "paymentStatus" | "totalAmount"> }) {
  if (order.paymentMethod !== "COD" || order.paymentStatus === "PAID" || order.paymentStatus === "CANCELLED") return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-extrabold text-secondary">
      <Banknote className="size-3.5" aria-hidden="true" />
      COD – {formatRs(order.totalAmount)} to collect
    </p>
  );
}

/**
 * The one action a chef can take now, decided by the assignment first and then
 * the order status:
 *   ASSIGNED (not yet accepted) → Accept Order (also if the admin already moved
 *                                 the order to Preparing)
 *   ACCEPTED + CONFIRMED        → Start Preparation
 *   ACCEPTED + PREPARING        → Mark Ready
 *   READY and later             → status only
 * The server re-checks every step (src/lib/orders/operations.ts).
 */
export function ChefNextAction({ order }: { order: ChefOrder }) {
  const assignment = order.chefAssignments[0];
  if (!assignment || (assignment.status !== "ASSIGNED" && assignment.status !== "ACCEPTED")) return null;

  if (assignment.status === "ASSIGNED" && ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status)) {
    return (
      <ActionButton action={chefAcceptOrder.bind(null, order.id)} optimistic={{ assignmentStatus: "ACCEPTED" }} pendingLabel="Accepting…">
        Accept Order
      </ActionButton>
    );
  }
  if (order.status === "PENDING") {
    return <p className="text-sm text-muted">Accepted. Waiting for the Ghar Se Daftar team to confirm the order.</p>;
  }
  if (order.status === "CONFIRMED") {
    return (
      <ActionButton action={chefStartPreparing.bind(null, order.id)} optimistic={{ orderStatus: "PREPARING" }} pendingLabel="Starting…">
        Start Preparation
      </ActionButton>
    );
  }
  if (order.status === "PREPARING") {
    return (
      <ActionButton action={chefMarkReady.bind(null, order.id)} optimistic={{ orderStatus: "READY" }} pendingLabel="Marking ready…">
        Mark Ready
      </ActionButton>
    );
  }
  if (order.status === "READY") {
    return <p className="text-sm font-semibold text-primary">Ready. The rider will collect it shortly.</p>;
  }
  return null;
}

/** Pickup status for the kitchen: who is collecting, and whether they have. No live tracking. */
export function ChefRiderInfo({ order }: { order: Pick<ChefOrder, "delivery" | "status"> }) {
  const delivery = order.delivery;
  const name = delivery?.rider?.displayName ?? delivery?.riderName;
  if (!delivery || !name || delivery.status === "CANCELLED") return null;
  const pickedUp = delivery.status === "PICKED_UP" || delivery.status === "DELIVERED";
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm">
      <Bike className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 break-words">
        {pickedUp ? (
          <>
            Picked up by <strong>{name}</strong>
            {delivery.pickupAt ? <span className="text-muted"> · {formatDateTime(delivery.pickupAt)}</span> : null}
          </>
        ) : (
          <>
            Rider: <strong>{name}</strong> <span className="text-muted">· {delivery.status === "ACCEPTED" ? "on the way to collect" : "assigned"}</span>
          </>
        )}
      </span>
    </p>
  );
}

export function ChefOrderCard({ order }: { order: ChefOrder }) {
  const assignment = order.chefAssignments[0];
  const mealCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <OptimisticStatusProvider>
    <article className="glass-card min-w-0 rounded-[24px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/chef/orders/${order.id}`} className="text-lg font-extrabold text-primary hover:underline">{order.orderNumber}</Link>
          <p className="text-sm text-muted">{order.customerName.split(" ")[0]}{order.companyName ? ` · ${order.companyName}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LiveOrderBadge status={order.status} />
          {assignment && (assignment.status === "ASSIGNED" || assignment.status === "ACCEPTED") ? <LiveAssignmentBadge status={assignment.status} /> : null}
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="min-w-0 break-words font-semibold">{item.itemName}{item.serviceDay ? <span className="font-normal text-muted"> · {item.serviceDay}</span> : null}</span>
            <span className="font-bold">× {item.quantity}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-primary" aria-hidden="true" />{formatDay(order.deliveryDate)} · {deliverySlotLabel(order.deliverySlot)}</span>
        <span className="flex min-w-0 items-center gap-1.5"><MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" /><span className="break-words">{order.deliveryArea}</span></span>
        <span>{mealCount} meal{mealCount === 1 ? "" : "s"}{order.assignedKitchen ? ` · ${order.assignedKitchen.name}` : ""}</span>
      </div>

      {order.specialInstructions || assignment?.note ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-primary/5 p-3 text-sm">
          <StickyNote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 break-words">{[assignment?.note, order.specialInstructions].filter(Boolean).join(" · ")}</span>
        </p>
      ) : null}

      <div className="mt-3">
        <ChefRiderInfo order={order} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <CodNotice order={order} />
        <ChefNextAction order={order} />
      </div>
    </article>
    </OptimisticStatusProvider>
  );
}
