import type { OrderStatus } from "@prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db/prisma";
import { getOrderWithDetails } from "@/lib/orders/queries";
import { formatRs, PAYMENT_METHOD_LABELS } from "@/lib/orders/format";
import { adminNewOrderEmail, orderReceivedEmail, orderStatusEmail, paymentReceivedEmail } from "@/lib/email/templates";
import { adminNotificationRecipients, createInAppNotification, sendNotificationEmail, type NotificationType } from "./service";

/** Customer emails sent on these status changes. Other statuses only update tracking. */
const STATUS_EMAILS: Partial<Record<OrderStatus, NotificationType>> = {
  CONFIRMED: "ORDER_CONFIRMED",
  OUT_FOR_DELIVERY: "ORDER_OUT_FOR_DELIVERY",
  DELIVERED: "ORDER_DELIVERED",
  CANCELLED: "ORDER_CANCELLED"
};

function trackUrl(orderNumber: string) {
  return `${getAppUrl()}/orders/${orderNumber}`;
}

/** New order: customer confirmation email, admin feed entry and optional admin email. */
export async function notifyOrderPlaced(orderId: string) {
  const order = await getOrderWithDetails(orderId);
  if (!order) return;

  const summary = `${order.customerName} · ${formatRs(order.totalAmount)} · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`;

  await Promise.all([
    sendNotificationEmail({
      type: "ORDER_RECEIVED",
      audience: "CUSTOMER",
      to: order.customerEmail,
      email: orderReceivedEmail(order, trackUrl(order.orderNumber)),
      dedupeKey: `order:${order.id}:received:customer`,
      userId: order.userId,
      orderId: order.id
    }),
    createInAppNotification({
      type: "ADMIN_NEW_ORDER",
      audience: "ADMIN",
      subject: `New order ${order.orderNumber}`,
      body: summary,
      dedupeKey: `order:${order.id}:received:admin-feed`,
      orderId: order.id
    }),
    sendNotificationEmail({
      type: "ADMIN_NEW_ORDER",
      audience: "ADMIN",
      to: adminNotificationRecipients(),
      email: adminNewOrderEmail(order, `${getAppUrl()}/admin/orders/${order.id}`),
      dedupeKey: `order:${order.id}:received:admin-email`,
      orderId: order.id
    })
  ]);
}

export async function notifyOrderStatusChanged(orderId: string, status: OrderStatus) {
  const type = STATUS_EMAILS[status];
  if (!type) return;

  const order = await getOrderWithDetails(orderId);
  if (!order) return;

  await sendNotificationEmail({
    type,
    audience: "CUSTOMER",
    to: order.customerEmail,
    email: orderStatusEmail(order, status, trackUrl(order.orderNumber)),
    dedupeKey: `order:${order.id}:status:${status}`,
    userId: order.userId,
    orderId: order.id
  });
}

export async function notifyPaymentReceived(orderId: string) {
  const order = await getOrderWithDetails(orderId);
  if (!order || order.paymentStatus !== "PAID") return;

  await sendNotificationEmail({
    type: "PAYMENT_RECEIVED",
    audience: "CUSTOMER",
    to: order.customerEmail,
    email: paymentReceivedEmail(order, trackUrl(order.orderNumber)),
    dedupeKey: `order:${order.id}:payment:paid`,
    userId: order.userId,
    orderId: order.id
  });
}

/**
 * After a provider-verified payment: "payment received", plus "order confirmed"
 * when the payment auto-confirmed the order. Both are de-duplicated, so a
 * retried webhook or the browser return route can't send them twice.
 */
export async function notifyVerifiedPayment(orderId: string) {
  await notifyPaymentReceived(orderId);
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (order?.status === "CONFIRMED") await notifyOrderStatusChanged(orderId, "CONFIRMED");
}

export async function notifyChefAssigned(orderId: string, chefUserId: string | null, orderNumber: string) {
  if (!chefUserId) return;
  await createInAppNotification({
    type: "CHEF_ORDER_ASSIGNED",
    audience: "CHEF",
    subject: `New order ${orderNumber} assigned to you`,
    dedupeKey: `order:${orderId}:assigned:${chefUserId}:${Date.now()}`,
    userId: chefUserId,
    orderId
  });
}

export async function notifyRiderAssigned(orderId: string, riderUserId: string | null, orderNumber: string) {
  if (!riderUserId) return;
  await createInAppNotification({
    type: "RIDER_DELIVERY_ASSIGNED",
    audience: "RIDER",
    subject: `New delivery ${orderNumber} assigned to you`,
    dedupeKey: `order:${orderId}:rider-assigned:${riderUserId}:${Date.now()}`,
    userId: riderUserId,
    orderId
  });
}
