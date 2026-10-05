import type { OrderStatus, UserRole } from "@prisma/client";

/**
 * Order lifecycle. Mirrored by the guard_order_status_transition trigger in
 * supabase/migrations/20260929120100_order_platform_security.sql, so an invalid
 * transition is rejected by the database even if server code has a bug.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: []
};

/** Transitions a chef may perform on orders assigned to (and accepted by) them. */
const CHEF_TRANSITIONS: ReadonlyArray<[OrderStatus, OrderStatus]> = [
  ["CONFIRMED", "PREPARING"],
  ["PREPARING", "READY"]
];

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function canRoleTransition(role: UserRole, from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) return false;
  if (role === "ADMIN") return true;
  if (role === "HOME_CHEF") return CHEF_TRANSITIONS.some(([f, t]) => f === from && t === to);
  return false;
}

export function isTerminalStatus(status: OrderStatus) {
  return ORDER_TRANSITIONS[status].length === 0;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Order received",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  PENDING: "We've received your order and will confirm it shortly.",
  CONFIRMED: "Your order is confirmed and scheduled with a home kitchen.",
  PREPARING: "Your meal is being freshly prepared.",
  READY: "Your meal is packed and waiting for pickup.",
  OUT_FOR_DELIVERY: "Your meal is on its way to your office.",
  DELIVERED: "Your meal has been delivered. Enjoy!",
  CANCELLED: "This order was cancelled."
};

/** Customer-facing tracking stages, in order. */
export const TRACKING_STAGES: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

export const ALL_ORDER_STATUSES = Object.keys(ORDER_TRANSITIONS) as OrderStatus[];

/** Admin action button label for moving an order into a status. */
export const ADMIN_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Confirm order",
  PREPARING: "Mark preparing",
  READY: "Mark ready",
  OUT_FOR_DELIVERY: "Mark out for delivery",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order"
};
