"use client";

import { createContext, useContext, useOptimistic, type ReactNode } from "react";
import type { ChefAssignmentStatus, DeliveryStatus, OrderStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { AssignmentBadge, OrderStatusBadge } from "./status-badges";
import { DeliveryStatusBadge } from "./delivery-badges";

/**
 * Optimistic status for one order card/page. A status button patches the
 * expected new status at the start of its transition, so the badge changes the
 * moment the button is clicked. React drops the patch when the transition ends:
 * on success the server's re-render already shows the real status; on failure
 * the old status returns and the button shows the error. Nothing is faked
 * beyond the in-flight request.
 */
export type StatusPatch = { orderStatus?: OrderStatus; assignmentStatus?: ChefAssignmentStatus; deliveryStatus?: DeliveryStatus };

const OptimisticContext = createContext<{ patch: StatusPatch; apply: (patch: StatusPatch) => void } | null>(null);

export function OptimisticStatusProvider({ children }: { children: ReactNode }) {
  const [patch, apply] = useOptimistic<StatusPatch, StatusPatch>({}, (current, next) => ({ ...current, ...next }));
  return <OptimisticContext.Provider value={{ patch, apply }}>{children}</OptimisticContext.Provider>;
}

/** Used by ActionButton; null outside a provider (then it simply shows a pending state). */
export function useOptimisticStatus() {
  return useContext(OptimisticContext);
}

function Saving() {
  return <Loader2 className="size-3.5 animate-spin text-muted" aria-label="Saving" />;
}

export function LiveOrderBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const patched = useContext(OptimisticContext)?.patch.orderStatus;
  return (
    <span className="inline-flex items-center gap-1.5">
      <OrderStatusBadge status={patched ?? status} className={className} />
      {patched && patched !== status ? <Saving /> : null}
    </span>
  );
}

export function LiveAssignmentBadge({ status }: { status: ChefAssignmentStatus }) {
  const patched = useContext(OptimisticContext)?.patch.assignmentStatus;
  return (
    <span className="inline-flex items-center gap-1.5">
      <AssignmentBadge status={patched ?? status} />
      {patched && patched !== status ? <Saving /> : null}
    </span>
  );
}

export function LiveDeliveryBadge({ status }: { status: DeliveryStatus }) {
  const patched = useContext(OptimisticContext)?.patch.deliveryStatus;
  return (
    <span className="inline-flex items-center gap-1.5">
      <DeliveryStatusBadge status={patched ?? status} />
      {patched && patched !== status ? <Saving /> : null}
    </span>
  );
}
