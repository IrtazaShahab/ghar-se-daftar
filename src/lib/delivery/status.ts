import type { DeliveryStatus, OrderStatus } from "@prisma/client";

/**
 * Rider-side delivery states. The order status remains the customer-facing
 * lifecycle; these say where the rider is in it:
 *
 *   ASSIGNED   admin assigned a rider        (order CONFIRMED / PREPARING / READY)
 *   ACCEPTED   rider accepted, heading to the kitchen
 *   PICKED_UP  rider collected the meal      (order OUT_FOR_DELIVERY)
 *   DELIVERED  handed over                   (order DELIVERED)
 *   CANCELLED  order cancelled
 */

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  ASSIGNED: "Awaiting rider",
  ACCEPTED: "Rider heading to kitchen",
  PICKED_UP: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

/** Short label for the rider's own list. */
export const RIDER_STATUS_LABELS: Record<DeliveryStatus, string> = {
  ASSIGNED: "New",
  ACCEPTED: "Accepted",
  PICKED_UP: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export const ACTIVE_DELIVERY_STATUSES: readonly DeliveryStatus[] = ["ASSIGNED", "ACCEPTED", "PICKED_UP"];

export function isActiveDelivery(status: DeliveryStatus) {
  return ACTIVE_DELIVERY_STATUSES.includes(status);
}

/** Orders an admin may assign (or reassign) a rider to. */
export const RIDER_ASSIGNABLE_ORDER_STATUSES: readonly OrderStatus[] = ["CONFIRMED", "PREPARING", "READY"];

/** Delivery states in which the rider can still be swapped (before pickup). */
export const RIDER_REASSIGNABLE_DELIVERY_STATUSES: readonly DeliveryStatus[] = ["ASSIGNED", "ACCEPTED"];
