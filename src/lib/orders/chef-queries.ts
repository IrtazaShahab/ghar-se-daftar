import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Kitchen-facing order data. Chefs get what they need to cook: items,
 * instructions, timing, delivery area and (for COD) the amount to collect.
 * No customer email/phone, full payment records or unrelated orders.
 */
export const chefOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  customerName: true,
  companyName: true,
  deliveryArea: true,
  deliveryCity: true,
  deliveryDate: true,
  deliverySlot: true,
  specialInstructions: true,
  paymentMethod: true,
  paymentStatus: true,
  totalAmount: true,
  createdAt: true,
  assignedKitchen: { select: { name: true } },
  items: { orderBy: { id: "asc" }, select: { id: true, itemName: true, itemDetails: true, serviceDay: true, quantity: true } },
  chefAssignments: {
    orderBy: { assignedAt: "desc" },
    take: 1,
    select: { id: true, homeChefId: true, status: true, note: true, assignedAt: true, acceptedAt: true }
  }
} satisfies Prisma.OrderSelect;

export type ChefOrder = Prisma.OrderGetPayload<{ select: typeof chefOrderSelect }>;

export const CHEF_TABS = ["new", "accepted", "preparing", "ready", "completed"] as const;
export type ChefTab = (typeof CHEF_TABS)[number];

export const CHEF_TAB_LABELS: Record<ChefTab, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed"
};

/** Orders currently assigned to this chef, in the given kitchen tab. */
function tabWhere(chefId: string, tab: ChefTab): Prisma.OrderWhereInput {
  const mine: Prisma.OrderWhereInput = { assignedChefId: chefId };
  const assignment = (status: "ASSIGNED" | "ACCEPTED") => ({ chefAssignments: { some: { homeChefId: chefId, status } } });

  switch (tab) {
    // Waiting for this chef to accept, even if the admin already moved it to Preparing.
    case "new":
      return { ...mine, status: { in: ["PENDING", "CONFIRMED", "PREPARING"] }, ...assignment("ASSIGNED") };
    case "accepted":
      return { ...mine, status: { in: ["PENDING", "CONFIRMED"] }, ...assignment("ACCEPTED") };
    case "preparing":
      return { ...mine, status: "PREPARING", NOT: assignment("ASSIGNED") };
    case "ready":
      return { ...mine, status: "READY" };
    case "completed":
      return { ...mine, status: { in: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] } };
  }
}

export async function getChefOrders(chefId: string, tab: ChefTab) {
  return prisma.order.findMany({
    where: tabWhere(chefId, tab),
    orderBy: tab === "completed" ? { updatedAt: "desc" } : [{ deliveryDate: "asc" }, { createdAt: "asc" }],
    take: tab === "completed" ? 50 : 100,
    select: chefOrderSelect
  });
}

/**
 * All five tab counts in one round trip (same rules as tabWhere). `chefId` is
 * bound by Prisma, never interpolated; only this chef's orders are counted.
 */
export async function getChefTabCounts(chefId: string): Promise<Record<ChefTab, number>> {
  const [row] = await prisma.$queryRaw<Array<Record<ChefTab, number | bigint>>>`
    SELECT
      COUNT(*) FILTER (WHERE o.status IN ('PENDING', 'CONFIRMED', 'PREPARING') AND EXISTS (
        SELECT 1 FROM "ChefAssignment" a WHERE a."orderId" = o.id AND a."homeChefId" = ${chefId} AND a.status = 'ASSIGNED')) AS "new",
      COUNT(*) FILTER (WHERE o.status IN ('PENDING', 'CONFIRMED') AND EXISTS (
        SELECT 1 FROM "ChefAssignment" a WHERE a."orderId" = o.id AND a."homeChefId" = ${chefId} AND a.status = 'ACCEPTED')) AS "accepted",
      COUNT(*) FILTER (WHERE o.status = 'PREPARING' AND NOT EXISTS (
        SELECT 1 FROM "ChefAssignment" a WHERE a."orderId" = o.id AND a."homeChefId" = ${chefId} AND a.status = 'ASSIGNED')) AS "preparing",
      COUNT(*) FILTER (WHERE o.status = 'READY') AS "ready",
      COUNT(*) FILTER (WHERE o.status IN ('OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')) AS "completed"
    FROM "Order" o
    WHERE o."homeChefId" = ${chefId}
  `;
  return Object.fromEntries(CHEF_TABS.map((tab) => [tab, Number(row?.[tab] ?? 0)])) as Record<ChefTab, number>;
}

/** A single order, only if it is currently assigned to this chef. */
export async function getChefOrder(chefId: string, orderId: string) {
  return prisma.order.findFirst({ where: { id: orderId, assignedChefId: chefId }, select: chefOrderSelect });
}
