import type { DeliveryStatus, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { estimateEta, isFresh, type Eta, type LatLng } from "./geo";
import { ACTIVE_DELIVERY_STATUSES, isActiveDelivery } from "./status";

/**
 * Read models for deliveries, one per audience. Privacy rules live here, on
 * the server, so data a role must not see never reaches its browser:
 *
 * RIDER     own deliveries only. Customer first name; phone only after pickup
 *           (while carrying the order); full address and pin only while the
 *           delivery is active (area only afterwards); COD amount to collect.
 * CUSTOMER  own order only. Rider name and phone only while out for delivery;
 *           live position only while sharing and fresh (never stale GPS).
 * CHEF      rider name and pickup status for orders assigned to them.
 * ADMIN     everything, including the last known (possibly stale) position.
 */

const pin = (lat: number | null, lng: number | null): LatLng | null => (lat !== null && lng !== null ? { latitude: lat, longitude: lng } : null);

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

// ---------------------------------------------------------------------------
// Rider
// ---------------------------------------------------------------------------

const riderDeliverySelect = {
  id: true,
  status: true,
  assignedAt: true,
  acceptedAt: true,
  pickupAt: true,
  deliveredAt: true,
  cancelledAt: true,
  sharingStartedAt: true,
  lastLocationAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerName: true,
      customerPhone: true,
      companyName: true,
      deliveryAddress: true,
      deliveryArea: true,
      deliveryCity: true,
      deliveryLatitude: true,
      deliveryLongitude: true,
      deliveryDate: true,
      deliverySlot: true,
      specialInstructions: true,
      paymentMethod: true,
      paymentStatus: true,
      totalAmount: true,
      items: { orderBy: { id: "asc" }, select: { id: true, itemName: true, quantity: true } },
      assignedKitchen: { select: { name: true, area: true, address: true } },
      assignedChef: { select: { displayName: true, phone: true, area: true } }
    }
  }
} satisfies Prisma.DeliverySelect;

type RiderDeliveryRow = Prisma.DeliveryGetPayload<{ select: typeof riderDeliverySelect }>;

export type RiderDeliveryView = {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  status: DeliveryStatus;
  active: boolean;
  customerFirstName: string;
  companyName: string | null;
  /** Only while the rider is carrying the order. */
  customerPhone: string | null;
  /** Full address only while active; afterwards just the area. */
  deliveryAddress: string | null;
  deliveryArea: string;
  deliveryCity: string;
  destination: LatLng | null;
  deliveryDate: Date;
  deliverySlot: string | null;
  instructions: string | null;
  /** Cash to collect at the door (COD, unpaid, not cancelled). */
  codToCollect: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: Array<{ id: string; itemName: string; quantity: number }>;
  /** Pickup details only before pickup. */
  pickup: { kitchenName: string | null; area: string | null; address: string | null; chefName: string | null; chefPhone: string | null } | null;
  assignedAt: Date | null;
  acceptedAt: Date | null;
  pickupAt: Date | null;
  deliveredAt: Date | null;
  sharing: boolean;
  lastLocationAt: Date | null;
};

function toRiderView(row: RiderDeliveryRow): RiderDeliveryView {
  const { order } = row;
  const active = isActiveDelivery(row.status) && order.status !== "CANCELLED" && order.status !== "DELIVERED";
  const carrying = active && row.status === "PICKED_UP";
  const beforePickup = active && (row.status === "ASSIGNED" || row.status === "ACCEPTED");
  const cod = order.paymentMethod === "COD" && order.paymentStatus !== "PAID" && order.paymentStatus !== "CANCELLED" && order.status !== "CANCELLED";

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    status: row.status,
    active,
    customerFirstName: firstName(order.customerName),
    companyName: active ? order.companyName : null,
    customerPhone: carrying ? order.customerPhone : null,
    deliveryAddress: active ? order.deliveryAddress : null,
    deliveryArea: order.deliveryArea,
    deliveryCity: order.deliveryCity,
    destination: active ? pin(order.deliveryLatitude, order.deliveryLongitude) : null,
    deliveryDate: order.deliveryDate,
    deliverySlot: order.deliverySlot,
    instructions: active ? order.specialInstructions : null,
    codToCollect: cod ? order.totalAmount : null,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    items: order.items,
    pickup: beforePickup
      ? {
          kitchenName: order.assignedKitchen?.name ?? null,
          area: order.assignedKitchen?.area ?? order.assignedChef?.area ?? null,
          address: order.assignedKitchen?.address ?? null,
          chefName: order.assignedChef?.displayName ?? null,
          chefPhone: order.assignedChef?.phone ?? null
        }
      : null,
    assignedAt: row.assignedAt,
    acceptedAt: row.acceptedAt,
    pickupAt: row.pickupAt,
    deliveredAt: row.deliveredAt,
    sharing: carrying && row.sharingStartedAt !== null,
    lastLocationAt: carrying ? row.lastLocationAt : null
  };
}

/** The rider's active deliveries (oldest assignment first) and recent completed ones. */
export async function getRiderDeliveries(riderId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await prisma.delivery.findMany({
    where: {
      riderId,
      OR: [{ status: { in: [...ACTIVE_DELIVERY_STATUSES] } }, { status: { in: ["DELIVERED", "CANCELLED"] }, updatedAt: { gte: since } }]
    },
    orderBy: [{ assignedAt: "asc" }],
    take: 80,
    select: riderDeliverySelect
  });
  const views = rows.map(toRiderView);
  return {
    active: views.filter((view) => view.active),
    completed: views
      .filter((view) => !view.active)
      .sort((a, b) => (b.deliveredAt ?? b.assignedAt ?? new Date(0)).getTime() - (a.deliveredAt ?? a.assignedAt ?? new Date(0)).getTime())
      .slice(0, 30)
  };
}

/** One delivery, only if it is assigned to this rider (another rider's id returns null). */
export async function getRiderDelivery(riderId: string, orderId: string) {
  const row = await prisma.delivery.findFirst({ where: { orderId, riderId }, select: riderDeliverySelect });
  return row ? toRiderView(row) : null;
}

// ---------------------------------------------------------------------------
// Tracking (customer and admin)
// ---------------------------------------------------------------------------

const trackingSelect = {
  id: true,
  orderNumber: true,
  status: true,
  deliveryLatitude: true,
  deliveryLongitude: true,
  delivery: {
    select: {
      status: true,
      riderName: true,
      riderPhone: true,
      pickupAt: true,
      deliveredAt: true,
      sharingStartedAt: true,
      lastLatitude: true,
      lastLongitude: true,
      lastAccuracyM: true,
      lastLocationAt: true,
      issueNote: true,
      issueReportedAt: true,
      rider: { select: { displayName: true, phone: true } }
    }
  }
} satisfies Prisma.OrderSelect;

type TrackingRow = Prisma.OrderGetPayload<{ select: typeof trackingSelect }>;

export type TrackingView = {
  orderStatus: OrderStatus;
  /** Server time the view was built (clients compute "x minutes ago" from it). */
  generatedAt: string;
  delivery: null | {
    status: DeliveryStatus;
    /** Null until the order is out for delivery (customer view). */
    riderName: string | null;
    /** Only while out for delivery. */
    riderPhone: string | null;
    sharing: boolean;
    /** Present only when the point is fresh; stale points are never shown as live. */
    live: { latitude: number; longitude: number; accuracyM: number | null; recordedAt: string } | null;
    /** Time of the last point while out for delivery (to say how old it is). */
    lastLocationAt: string | null;
    eta: Eta | null;
    destination: LatLng | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    /** Admin only. */
    issueNote?: string | null;
    lastKnown?: { latitude: number; longitude: number; accuracyM: number | null; recordedAt: string; fresh: boolean } | null;
  };
};

function buildTracking(row: TrackingRow, audience: "CUSTOMER" | "ADMIN", now = new Date()): TrackingView {
  const delivery = row.delivery;
  const generatedAt = now.toISOString();
  if (!delivery || (!delivery.rider && !delivery.riderName)) return { orderStatus: row.status, generatedAt, delivery: null };

  const outForDelivery = row.status === "OUT_FOR_DELIVERY" && delivery.status === "PICKED_UP";
  const sharing = outForDelivery && delivery.sharingStartedAt !== null;
  const point = pin(delivery.lastLatitude, delivery.lastLongitude);
  const fresh = sharing && point !== null && isFresh(delivery.lastLocationAt, now);
  const destination = pin(row.deliveryLatitude, row.deliveryLongitude);
  const riderName = delivery.rider?.displayName ?? delivery.riderName;
  const riderPhone = delivery.rider?.phone ?? delivery.riderPhone;
  const showRider = audience === "ADMIN" || outForDelivery || row.status === "DELIVERED";

  const live =
    fresh && point
      ? { latitude: point.latitude, longitude: point.longitude, accuracyM: delivery.lastAccuracyM, recordedAt: delivery.lastLocationAt!.toISOString() }
      : null;

  return {
    orderStatus: row.status,
    generatedAt,
    delivery: {
      status: delivery.status,
      riderName: showRider ? riderName : null,
      riderPhone: audience === "ADMIN" ? riderPhone : outForDelivery ? riderPhone : null,
      sharing,
      live,
      lastLocationAt: outForDelivery && delivery.lastLocationAt ? delivery.lastLocationAt.toISOString() : null,
      eta: live && destination ? estimateEta(live, destination) : null,
      destination,
      pickedUpAt: delivery.pickupAt?.toISOString() ?? null,
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      ...(audience === "ADMIN"
        ? {
            issueNote: delivery.issueNote,
            lastKnown:
              point && delivery.lastLocationAt
                ? { latitude: point.latitude, longitude: point.longitude, accuracyM: delivery.lastAccuracyM, recordedAt: delivery.lastLocationAt.toISOString(), fresh: isFresh(delivery.lastLocationAt, now) }
                : null
          }
        : {})
    }
  };
}

/** Tracking for the customer who owns the order (another customer's number returns null). */
export async function getCustomerTracking(orderNumber: string, userId: string) {
  const row = await prisma.order.findFirst({ where: { orderNumber: orderNumber.toUpperCase(), userId }, select: trackingSelect });
  return row ? buildTracking(row, "CUSTOMER") : null;
}

export async function getAdminTracking(orderId: string) {
  const row = await prisma.order.findUnique({ where: { id: orderId }, select: trackingSelect });
  return row ? buildTracking(row, "ADMIN") : null;
}

export async function getAdminTrackingByNumber(orderNumber: string) {
  const row = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, select: trackingSelect });
  return row ? buildTracking(row, "ADMIN") : null;
}

// ---------------------------------------------------------------------------
// Admin lists
// ---------------------------------------------------------------------------

export const ADMIN_DELIVERY_TABS = ["needs-rider", "assigned", "on-the-way", "issues", "completed"] as const;
export type AdminDeliveryTab = (typeof ADMIN_DELIVERY_TABS)[number];

export const ADMIN_DELIVERY_TAB_LABELS: Record<AdminDeliveryTab, string> = {
  "needs-rider": "Needs rider",
  assigned: "Assigned",
  "on-the-way": "On the way",
  issues: "Issues",
  completed: "Completed today"
};

type AdminDeliveryRow = Prisma.OrderGetPayload<{ select: typeof adminDeliveryRowSelect }>;

/** Which board tab an order is in; an order with an open issue also shows under Issues. */
function adminTabsFor(row: AdminDeliveryRow): AdminDeliveryTab[] {
  const tabs: AdminDeliveryTab[] = [];
  const hasRider = Boolean(row.delivery?.rider || row.delivery?.riderName) && row.delivery?.status !== "CANCELLED";
  if (row.status === "DELIVERED") tabs.push("completed");
  else if (row.status === "OUT_FOR_DELIVERY") tabs.push("on-the-way");
  else if (!hasRider) tabs.push("needs-rider");
  else tabs.push("assigned");
  if (row.status !== "DELIVERED" && row.delivery?.issueNote) tabs.push("issues");
  return tabs;
}

const adminDeliveryRowSelect = {
  id: true,
  orderNumber: true,
  status: true,
  customerName: true,
  deliveryArea: true,
  deliveryDate: true,
  deliverySlot: true,
  paymentMethod: true,
  paymentStatus: true,
  totalAmount: true,
  deliveryLatitude: true,
  deliveryLongitude: true,
  deliveredAt: true,
  assignedKitchen: { select: { name: true } },
  delivery: {
    select: {
      status: true,
      riderName: true,
      pickupAt: true,
      sharingStartedAt: true,
      lastLatitude: true,
      lastLongitude: true,
      lastLocationAt: true,
      issueNote: true,
      rider: { select: { displayName: true, phone: true } }
    }
  }
} satisfies Prisma.OrderSelect;

/**
 * The whole deliveries board in one query: every confirmed order that hasn't
 * been delivered yet, plus today's deliveries. Tabs and counts are computed
 * from the same rows, so switching tabs needs no request.
 */
export async function getAdminDeliveryBoard(startOfToday: Date) {
  const rows = await prisma.order.findMany({
    where: { OR: [{ status: { in: ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } }, { status: "DELIVERED", deliveredAt: { gte: startOfToday } }] },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
    take: 300,
    select: adminDeliveryRowSelect
  });

  const now = new Date();
  const board = Object.fromEntries(ADMIN_DELIVERY_TABS.map((tab) => [tab, [] as Array<ReturnType<typeof decorate>>])) as Record<AdminDeliveryTab, Array<ReturnType<typeof decorate>>>;

  function decorate(row: AdminDeliveryRow) {
    const point = row.delivery ? pin(row.delivery.lastLatitude, row.delivery.lastLongitude) : null;
    const destination = pin(row.deliveryLatitude, row.deliveryLongitude);
    const fresh = Boolean(point && row.delivery?.sharingStartedAt && isFresh(row.delivery.lastLocationAt, now));
    return {
      ...row,
      riderName: row.delivery?.status === "CANCELLED" ? null : (row.delivery?.rider?.displayName ?? row.delivery?.riderName ?? null),
      riderPhone: row.delivery?.rider?.phone ?? null,
      locationFresh: fresh,
      eta: fresh && point && destination ? estimateEta(point, destination) : null
    };
  }

  for (const row of rows) {
    const item = decorate(row);
    for (const tab of adminTabsFor(row)) board[tab].push(item);
  }
  board.completed.sort((a, b) => (b.deliveredAt?.getTime() ?? 0) - (a.deliveredAt?.getTime() ?? 0));
  return board;
}

/** Active riders for assignment dropdowns, with how many active deliveries each has. */
export async function getAssignableRiders() {
  const riders = await prisma.rider.findMany({
    where: { isActive: true, userId: { not: null } },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, phone: true, _count: { select: { deliveries: { where: { status: { in: [...ACTIVE_DELIVERY_STATUSES] } } } } } }
  });
  return riders.map((rider) => ({ id: rider.id, displayName: rider.displayName, phone: rider.phone, activeDeliveries: rider._count.deliveries }));
}
