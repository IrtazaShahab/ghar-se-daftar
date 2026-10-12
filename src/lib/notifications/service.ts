import { Prisma, type NotificationAudience } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/transport";
import type { RenderedEmail } from "@/lib/email/templates";

export type NotificationType =
  | "ORDER_RECEIVED"
  | "ORDER_CONFIRMED"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "ADMIN_NEW_ORDER"
  | "ADMIN_NEW_CORPORATE_REQUEST"
  | "CHEF_ORDER_ASSIGNED"
  | "RIDER_DELIVERY_ASSIGNED"
  | "CORPORATE_QUOTE_SENT"
  | "CORPORATE_QUOTE_RESPONSE";

type Links = { userId?: string | null; orderId?: string | null; corporateRequestId?: string | null };

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** "ayesha@gmail.com" → "a***@gmail.com" for logs. */
function maskEmail(address: string) {
  const [local, domain] = address.split("@");
  return domain ? `${local.slice(0, 1)}***@${domain}` : "[invalid address]";
}

function logEmail(level: "info" | "warn" | "error", type: NotificationType, dedupeKey: string, message: string) {
  console[level](`[email] ${type} (${dedupeKey}): ${message}`);
}

/**
 * Sends one email at most once per `dedupeKey`. The Notification row is created
 * first; if another request already created it (double click, retried webhook,
 * repeated action), nothing is sent again. Every outcome is stored on the row
 * (SENT / SKIPPED / FAILED with a reason). Never throws, so a mail outage can't
 * break ordering: callers run this after their database work has committed.
 */
export async function sendNotificationEmail({
  type,
  audience,
  to,
  email,
  dedupeKey,
  ...links
}: Links & {
  type: NotificationType;
  audience: NotificationAudience;
  to: string | string[];
  email: RenderedEmail;
  dedupeKey: string;
}) {
  const recipients = (Array.isArray(to) ? to : [to]).map((value) => value.trim()).filter(Boolean);

  let notificationId: string;
  try {
    const created = await prisma.notification.create({
      data: {
        type,
        audience,
        channel: "EMAIL",
        status: "PENDING",
        recipient: recipients.join(", ") || null,
        subject: email.subject,
        dedupeKey,
        userId: links.userId ?? null,
        orderId: links.orderId ?? null,
        corporateRequestId: links.corporateRequestId ?? null
      },
      select: { id: true }
    });
    notificationId = created.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      logEmail("info", type, dedupeKey, "duplicate prevented (already recorded)");
      return;
    }
    logEmail("error", type, dedupeKey, `could not be recorded: ${error instanceof Error ? error.message : "unknown error"}`);
    return;
  }

  const result = recipients.length === 0
    ? ({ status: "skipped", reason: audience === "ADMIN" ? "No ADMIN_NOTIFICATION_EMAILS configured" : "No recipient address" } as const)
    : await sendEmail({ to: recipients, subject: email.subject, html: email.html, text: email.text });

  await prisma.notification
    .update({
      where: { id: notificationId },
      data:
        result.status === "sent"
          ? { status: "SENT", sentAt: new Date() }
          : result.status === "skipped"
            ? { status: "SKIPPED", error: result.reason }
            : { status: "FAILED", error: result.error }
    })
    .catch((error: unknown) => logEmail("error", type, dedupeKey, `status update failed: ${error instanceof Error ? error.message : "unknown error"}`));

  const to_ = recipients.map(maskEmail).join(", ");
  if (result.status === "sent") logEmail("info", type, dedupeKey, `sent to ${to_}`);
  else if (result.status === "skipped") logEmail("warn", type, dedupeKey, `skipped: ${result.reason}`);
  else logEmail("error", type, dedupeKey, `failed for ${to_}: ${result.error}`);
}

/** In-app notification (e.g. the admin dashboard feed). Idempotent via dedupeKey. */
export async function createInAppNotification({
  type,
  audience,
  subject,
  body,
  dedupeKey,
  ...links
}: Links & { type: NotificationType; audience: NotificationAudience; subject: string; body?: string; dedupeKey: string }) {
  try {
    await prisma.notification.create({
      data: {
        type,
        audience,
        channel: "IN_APP",
        status: "SENT",
        sentAt: new Date(),
        subject,
        body: body ?? null,
        dedupeKey,
        userId: links.userId ?? null,
        orderId: links.orderId ?? null,
        corporateRequestId: links.corporateRequestId ?? null
      }
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      console.error(`In-app notification ${type} failed:`, error instanceof Error ? error.message : error);
    }
  }
}

/**
 * Admin inboxes for operational alerts: comma-separated ADMIN_NOTIFICATION_EMAILS
 * (ADMIN_EMAILS is accepted as a fallback). Only used as email recipients; admin
 * access itself is always the ADMIN role in the database.
 */
export function adminNotificationRecipients() {
  return (process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
