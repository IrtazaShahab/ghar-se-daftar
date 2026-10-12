import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Everything the confirmation, tracking, admin and email views need about an order. */
export const orderDetailInclude = {
  items: { orderBy: { id: "asc" } },
  payments: { orderBy: { createdAt: "desc" } },
  statusHistory: {
    orderBy: { createdAt: "asc" },
    include: { changedBy: { select: { fullName: true } } }
  },
  assignedChef: { select: { id: true, displayName: true, area: true, phone: true } },
  assignedKitchen: { select: { id: true, name: true, area: true } },
  chefAssignments: {
    orderBy: { assignedAt: "desc" },
    include: { homeChef: { select: { displayName: true } } }
  },
  delivery: { select: { riderId: true, status: true, issueNote: true } }
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

/**
 * Order for its owner only. The order number is looked up together with the
 * user id, so guessing another customer's number returns nothing.
 */
export async function getCustomerOrder(orderNumber: string, userId: string) {
  return prisma.order.findFirst({
    where: { orderNumber: orderNumber.toUpperCase(), userId },
    include: orderDetailInclude
  });
}

export async function getOrderForAdmin(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: orderDetailInclude });
}

export async function getOrderWithDetails(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: orderDetailInclude });
}

/** The payment the customer is expected to settle (latest attempt). */
export function currentPayment(order: Pick<OrderWithDetails, "payments">) {
  return order.payments[0] ?? null;
}
