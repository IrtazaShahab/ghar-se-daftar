import { runAfter } from "@/lib/run-after";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Actor } from "@/lib/auth/guards";
import { CLEARED_LOCATION, type OperationResult } from "@/lib/orders/operations";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { notifyRiderAssigned } from "@/lib/notifications/orders";
import { MAX_ACCURACY_M, SERVER_MIN_INTERVAL_MS, isValidLatLng } from "./geo";
import { RIDER_ASSIGNABLE_ORDER_STATUSES, RIDER_REASSIGNABLE_DELIVERY_STATUSES } from "./status";

/**
 * Rider/delivery operations. Order status changes (pickup → Out for delivery,
 * Delivered) go through transitionOrder in orders/operations.ts, which also
 * keeps the Delivery row in step. Every function here re-checks who is acting:
 * riders can only touch deliveries whose riderId is their own, and that id is
 * always derived from the session by the caller (requireRiderActor).
 */

function audit(actor: Actor, action: string, entityId: string, metadata?: Prisma.InputJsonValue) {
  runAfter(() =>
    prisma.auditLog
      .create({ data: { actorId: actor.userId, action, entity: "Delivery", entityId, metadata } })
      .then(() => undefined)
      .catch(() => undefined)
  );
}

/** Admin assigns a rider, or swaps the rider before pickup. */
export async function assignRider({ orderId, riderId, actor }: { orderId: string; riderId: string; actor: Actor }): Promise<OperationResult> {
  if (actor.role !== "ADMIN") return { ok: false, error: "Only admins can assign riders." };

  const [order, rider] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true, delivery: { select: { id: true, riderId: true, status: true } } }
    }),
    prisma.rider.findUnique({ where: { id: riderId }, select: { id: true, userId: true, isActive: true, displayName: true, phone: true } })
  ]);

  if (!order) return { ok: false, error: "Order not found." };
  if (!RIDER_ASSIGNABLE_ORDER_STATUSES.includes(order.status)) {
    return { ok: false, error: `A rider can be assigned once the order is confirmed and before it leaves the kitchen (it is ${ORDER_STATUS_LABELS[order.status].toLowerCase()}).` };
  }
  if (!rider || !rider.isActive) return { ok: false, error: "Choose an active rider." };
  if (!rider.userId) return { ok: false, error: `${rider.displayName} has no linked login yet, so they couldn't see the delivery.` };

  const current = order.delivery;
  if (current?.riderId && !RIDER_REASSIGNABLE_DELIVERY_STATUSES.includes(current.status)) {
    return { ok: false, error: "The rider has already picked up this order, so it can't be reassigned." };
  }
  if (current?.riderId === rider.id && current.status !== "CANCELLED") return { ok: true };

  const now = new Date();
  const fresh = {
    riderId: rider.id,
    status: "ASSIGNED" as const,
    riderName: rider.displayName,
    riderPhone: rider.phone,
    assignedById: actor.userId,
    assignedAt: now,
    acceptedAt: null,
    pickupAt: null,
    deliveredAt: null,
    cancelledAt: null,
    ...CLEARED_LOCATION
  };

  if (current) {
    // Compare-and-set on the state we checked, so a concurrent pickup wins.
    const updated = await prisma.delivery.updateMany({
      where: { id: current.id, riderId: current.riderId, status: current.status },
      data: fresh
    });
    if (updated.count !== 1) return { ok: false, error: "This delivery was just updated by someone else. Refresh the page and try again." };
  } else {
    await prisma.delivery.create({ data: { orderId: order.id, ...fresh } });
  }

  audit(actor, current?.riderId ? "DELIVERY_RIDER_REASSIGNED" : "DELIVERY_RIDER_ASSIGNED", order.id, { riderId: rider.id, previousRiderId: current?.riderId ?? null });
  runAfter(() => notifyRiderAssigned(order.id, rider.userId, order.orderNumber));
  return { ok: true };
}

/** Rider accepts a delivery assigned to them. */
export async function acceptDelivery({ orderId, riderId, actor }: { orderId: string; riderId: string; actor: Actor }): Promise<OperationResult> {
  const updated = await prisma.delivery.updateMany({
    where: { orderId, riderId, status: "ASSIGNED", order: { status: { in: [...RIDER_ASSIGNABLE_ORDER_STATUSES] } } },
    data: { status: "ACCEPTED", acceptedAt: new Date() }
  });
  if (updated.count === 0) return { ok: false, error: "This delivery is no longer waiting for you to accept it." };
  audit(actor, "DELIVERY_ACCEPTED", orderId, { riderId });
  return { ok: true };
}

/**
 * The rider explicitly turns on live location for an active delivery. Only
 * possible once the order is out for delivery and assigned to them.
 */
export async function startLocationSharing({ orderId, riderId, actor }: { orderId: string; riderId: string; actor: Actor }): Promise<OperationResult> {
  const updated = await prisma.delivery.updateMany({
    where: { orderId, riderId, status: "PICKED_UP", order: { status: "OUT_FOR_DELIVERY" } },
    data: { sharingStartedAt: new Date() }
  });
  if (updated.count === 0) return { ok: false, error: "Live location can only be shared while you are delivering this order." };
  audit(actor, "DELIVERY_SHARING_STARTED", orderId, { riderId });
  return { ok: true };
}

/** Rider stops sharing; the last point is deleted, not kept. */
export async function stopLocationSharing({ orderId, riderId, actor }: { orderId: string; riderId: string; actor: Actor }): Promise<OperationResult> {
  await prisma.delivery.updateMany({ where: { orderId, riderId }, data: CLEARED_LOCATION });
  audit(actor, "DELIVERY_SHARING_STOPPED", orderId, { riderId });
  return { ok: true };
}

export type LocationUpdateResult =
  /** `weak`: the reading was too inaccurate to store (e.g. IP-based location); the rider app says so. */
  | { ok: true; stored: boolean; weak?: true }
  /** `stop` tells the rider app to switch tracking off (delivery over, sharing off, not theirs). */
  | { ok: false; error: string; stop: boolean };

/**
 * Store the rider's latest point. One conditional UPDATE: it only matches the
 * rider's own active, sharing delivery, and only if the previous point is older
 * than SERVER_MIN_INTERVAL_MS (otherwise the point is skipped, not an error).
 */
export async function recordRiderLocation({
  orderId,
  riderId,
  latitude,
  longitude,
  accuracy
}: {
  orderId: string;
  riderId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
}): Promise<LocationUpdateResult> {
  if (!isValidLatLng({ latitude, longitude })) return { ok: false, error: "Invalid location.", stop: false };
  if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0)) return { ok: false, error: "Invalid accuracy.", stop: false };
  if (accuracy !== null && accuracy > MAX_ACCURACY_M) return { ok: true, stored: false, weak: true };

  const now = new Date();
  const active = { orderId, riderId, status: "PICKED_UP", sharingStartedAt: { not: null }, order: { status: "OUT_FOR_DELIVERY" } } satisfies Prisma.DeliveryWhereInput;
  const updated = await prisma.delivery.updateMany({
    where: { ...active, OR: [{ lastLocationAt: null }, { lastLocationAt: { lt: new Date(now.getTime() - SERVER_MIN_INTERVAL_MS) } }] },
    data: { lastLatitude: latitude, lastLongitude: longitude, lastAccuracyM: accuracy, lastLocationAt: now }
  });
  if (updated.count === 1) return { ok: true, stored: true };

  // Not stored: either throttled (fine) or the delivery is no longer active/theirs.
  const stillActive = await prisma.delivery.count({ where: active });
  return stillActive > 0 ? { ok: true, stored: false } : { ok: false, error: "Location sharing has ended for this delivery.", stop: true };
}

/** Admin flags (or clears, with an empty note) a delivery problem. */
export async function setDeliveryIssue({ orderId, note, actor }: { orderId: string; note: string | null; actor: Actor }): Promise<OperationResult> {
  if (actor.role !== "ADMIN") return { ok: false, error: "Only admins can update delivery issues." };
  const updated = await prisma.delivery.updateMany({
    where: { orderId },
    data: note ? { issueNote: note, issueReportedAt: new Date() } : { issueNote: null, issueReportedAt: null }
  });
  if (updated.count === 0) return { ok: false, error: "Assign a rider before recording a delivery issue." };
  audit(actor, note ? "DELIVERY_ISSUE_REPORTED" : "DELIVERY_ISSUE_CLEARED", orderId, note ? { note } : undefined);
  return { ok: true };
}
