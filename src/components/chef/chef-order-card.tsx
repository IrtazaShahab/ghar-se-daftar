import Link from "next/link";
import { Banknote, Clock, MapPin, StickyNote } from "lucide-react";
import type { ChefOrder } from "@/lib/orders/chef-queries";
import { deliverySlotLabel, formatDay, formatRs } from "@/lib/orders/format";
import { chefAcceptOrder, chefMarkReady, chefStartPreparing } from "@/app/actions/chef";
import { ActionButton } from "@/components/admin/action-controls";
import { AssignmentBadge, OrderStatusBadge } from "@/components/orders/status-badges";

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
    return <ActionButton action={chefAcceptOrder.bind(null, order.id)}>Accept Order</ActionButton>;
  }
  if (order.status === "PENDING") {
    return <p className="text-sm text-muted">Accepted. Waiting for the Ghar Se Daftar team to confirm the order.</p>;
  }
  if (order.status === "CONFIRMED") {
    return <ActionButton action={chefStartPreparing.bind(null, order.id)}>Start Preparation</ActionButton>;
  }
  if (order.status === "PREPARING") {
    return <ActionButton action={chefMarkReady.bind(null, order.id)}>Mark Ready</ActionButton>;
  }
  if (order.status === "READY") {
    return <p className="text-sm font-semibold text-primary">Ready. The rider will collect it shortly.</p>;
  }
  return null;
}

export function ChefOrderCard({ order }: { order: ChefOrder }) {
  const assignment = order.chefAssignments[0];
  const mealCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="glass-card rounded-[24px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/chef/orders/${order.id}`} className="text-lg font-extrabold text-primary hover:underline">{order.orderNumber}</Link>
          <p className="text-sm text-muted">{order.customerName.split(" ")[0]}{order.companyName ? ` · ${order.companyName}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          {assignment && (assignment.status === "ASSIGNED" || assignment.status === "ACCEPTED") ? <AssignmentBadge status={assignment.status} /> : null}
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="font-semibold">{item.itemName}{item.serviceDay ? <span className="font-normal text-muted"> · {item.serviceDay}</span> : null}</span>
            <span className="font-bold">× {item.quantity}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-primary" aria-hidden="true" />{formatDay(order.deliveryDate)} · {deliverySlotLabel(order.deliverySlot)}</span>
        <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-primary" aria-hidden="true" />{order.deliveryArea}</span>
        <span>{mealCount} meal{mealCount === 1 ? "" : "s"}{order.assignedKitchen ? ` · ${order.assignedKitchen.name}` : ""}</span>
      </div>

      {order.specialInstructions || assignment?.note ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-primary/5 p-3 text-sm">
          <StickyNote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{[assignment?.note, order.specialInstructions].filter(Boolean).join(" · ")}</span>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <CodNotice order={order} />
        <ChefNextAction order={order} />
      </div>
    </article>
  );
}
