import type { OrderStatus } from "@prisma/client";
import { Check, MapPin, Wallet, X } from "lucide-react";
import type { OrderWithDetails } from "@/lib/orders/queries";
import { ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS, TRACKING_STAGES } from "@/lib/orders/status";
import { PAYMENT_METHOD_LABELS, deliverySlotLabel, formatDateTime, formatDay, formatDeliveryFee, formatRs } from "@/lib/orders/format";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./status-badges";

/** Plain panel (no hover lift), for dense order screens. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-card rounded-[26px] p-5 md:p-6", className)} {...props} />;
}

export function PanelTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: typeof MapPin }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold tracking-tight">
      {Icon ? <Icon className="size-5 text-primary" aria-hidden="true" /> : null}
      {children}
    </h2>
  );
}

type ItemsOrder = Pick<OrderWithDetails, "items" | "subtotal" | "deliveryFee" | "discount" | "totalAmount">;

export function OrderItemsTable({ order, showUnitPrice = true }: { order: ItemsOrder; showUnitPrice?: boolean }) {
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm first:pt-0">
            <div className="min-w-0">
              <p className="font-bold">{item.itemName}</p>
              <p className="text-xs text-muted">
                {[item.serviceDay, item.itemDetails].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-xs text-muted">
                Qty {item.quantity}
                {showUnitPrice ? ` × ${formatRs(item.unitPrice)}` : ""}
              </p>
            </div>
            <p className="shrink-0 font-bold">{formatRs(item.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <OrderTotals order={order} />
    </div>
  );
}

export function OrderTotals({ order }: { order: Pick<OrderWithDetails, "subtotal" | "deliveryFee" | "discount" | "totalAmount"> }) {
  return (
    <dl className="space-y-2 border-t border-border pt-4 text-sm">
      <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatRs(order.subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className={cn("font-semibold", order.deliveryFee === 0 && "text-success")}>{formatDeliveryFee(order.deliveryFee)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="font-semibold">{order.discount > 0 ? `− ${formatRs(order.discount)}` : formatRs(0)}</dd></div>
      <div className="flex items-baseline justify-between border-t border-border pt-3"><dt className="font-bold">Total</dt><dd className="font-serif text-2xl font-semibold text-primary">{formatRs(order.totalAmount)}</dd></div>
    </dl>
  );
}

export function PaymentSummary({ order }: { order: Pick<OrderWithDetails, "paymentMethod" | "paymentStatus" | "totalAmount"> }) {
  const collect = order.paymentMethod === "COD" && order.paymentStatus !== "PAID" && order.paymentStatus !== "CANCELLED";
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-xs text-muted">Payment method</dt><dd className="mt-1 font-bold">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd></div>
      <div><dt className="text-xs text-muted">Payment status</dt><dd className="mt-1"><PaymentStatusBadge status={order.paymentStatus} /></dd></div>
      {collect ? (
        <div className="rounded-2xl bg-primary/5 p-4 sm:col-span-2">
          <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Wallet className="size-4" aria-hidden="true" />Amount to pay on delivery</dt>
          <dd className="mt-1 font-serif text-2xl font-semibold text-primary">{formatRs(order.totalAmount)}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function DeliverySummary({ order }: { order: Pick<OrderWithDetails, "deliveryAddress" | "deliveryArea" | "deliveryCity" | "deliveryDate" | "deliverySlot" | "companyName" | "specialInstructions"> }) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-xs text-muted">Delivery address</dt>
        <dd className="mt-1 flex items-start gap-2 font-semibold">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            {order.companyName ? <>{order.companyName}<br /></> : null}
            {order.deliveryAddress}<br />
            {order.deliveryArea}, {order.deliveryCity}
          </span>
        </dd>
      </div>
      <div><dt className="text-xs text-muted">First delivery day</dt><dd className="mt-1 font-semibold">{formatDay(order.deliveryDate)}</dd></div>
      <div><dt className="text-xs text-muted">Preferred time</dt><dd className="mt-1 font-semibold">{deliverySlotLabel(order.deliverySlot)}</dd></div>
      {order.specialInstructions ? (
        <div className="sm:col-span-2"><dt className="text-xs text-muted">Instructions</dt><dd className="mt-1 font-semibold">{order.specialInstructions}</dd></div>
      ) : null}
    </dl>
  );
}

/** Customer tracking stepper: received → confirmed → preparing → ready → out for delivery → delivered. */
export function TrackingTimeline({ status, history }: { status: OrderStatus; history: OrderWithDetails["statusHistory"] }) {
  const reachedAt = new Map<OrderStatus, Date>();
  for (const entry of history) reachedAt.set(entry.toStatus, entry.createdAt);

  if (status === "CANCELLED") {
    const cancelledAt = reachedAt.get("CANCELLED");
    return (
      <div className="flex items-start gap-4 rounded-[20px] border border-danger/20 bg-danger/5 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger text-white"><X className="size-5" aria-hidden="true" /></span>
        <div>
          <p className="font-bold text-danger">Order cancelled</p>
          <p className="mt-1 text-sm text-muted">{ORDER_STATUS_DESCRIPTIONS.CANCELLED}{cancelledAt ? ` (${formatDateTime(cancelledAt)})` : ""}</p>
        </div>
      </div>
    );
  }

  const currentIndex = TRACKING_STAGES.indexOf(status);

  return (
    <ol className="relative space-y-0" aria-label="Order progress">
      {TRACKING_STAGES.map((stage, index) => {
        const done = index < currentIndex || status === "DELIVERED";
        const current = index === currentIndex && status !== "DELIVERED";
        const time = reachedAt.get(stage);
        return (
          <li key={stage} className="relative flex gap-4 pb-6 last:pb-0" aria-current={current ? "step" : undefined}>
            {index < TRACKING_STAGES.length - 1 ? (
              <span aria-hidden="true" className={cn("absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5", index < currentIndex ? "bg-primary" : "bg-border")} />
            ) : null}
            <span
              className={cn(
                "relative grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                done && "border-primary bg-primary text-white",
                current && "border-primary bg-white text-primary shadow-[0_0_0_6px_rgba(33,79,50,0.12)]",
                !done && !current && "border-border bg-white text-muted"
              )}
            >
              {done ? <Check className="size-5" aria-hidden="true" /> : index + 1}
            </span>
            <div className="pt-1.5">
              <p className={cn("font-bold", !done && !current && "text-muted")}>{ORDER_STATUS_LABELS[stage]}</p>
              {current ? <p className="mt-0.5 text-sm text-muted">{ORDER_STATUS_DESCRIPTIONS[stage]}</p> : null}
              {time ? <p className="mt-0.5 text-xs text-muted">{formatDateTime(time)}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderHeader({ order }: { order: Pick<OrderWithDetails, "orderNumber" | "status" | "createdAt"> }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Order reference</p>
        <p className="mt-1 font-serif text-3xl font-semibold text-primary">{order.orderNumber}</p>
        <p className="mt-1 text-xs text-muted">Placed {formatDateTime(order.createdAt)}</p>
      </div>
      <OrderStatusBadge status={order.status} className="px-3 py-1.5 text-sm" />
    </div>
  );
}
