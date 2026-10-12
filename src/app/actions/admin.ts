"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdminActor } from "@/lib/auth/guards";
import { actionError, fromOperation, type ActionResult } from "@/lib/action-result";
import { assignChef, recordOfflinePayment, transitionOrder } from "@/lib/orders/operations";
import { assignRider, setDeliveryIssue } from "@/lib/delivery/operations";
import { ALL_ORDER_STATUSES } from "@/lib/orders/status";

/**
 * Admin server actions. Each one re-checks the admin role on the server; the
 * UI hiding buttons is only a convenience.
 */

const id = z.string().trim().min(1).max(64);

function revalidateOrder(orderId: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/chef", "layout");
  revalidatePath("/rider", "layout");
}

export async function adminTransitionOrder(orderId: string, to: OrderStatus): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    if (!id.safeParse(orderId).success || !ALL_ORDER_STATUSES.includes(to) || to === "CANCELLED" || to === "DELIVERED") {
      return { ok: false, error: "Invalid request." };
    }
    const result = await transitionOrder({ orderId, to, actor });
    if (result.ok) revalidateOrder(orderId);
    return fromOperation(result, "Order updated.");
  } catch (error) {
    return actionError(error, "Admin transition");
  }
}

export async function adminMarkDelivered(orderId: string, codCollected: boolean): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    if (!id.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
    const result = await transitionOrder({ orderId, to: "DELIVERED", actor, codCollected });
    if (result.ok) revalidateOrder(orderId);
    return fromOperation(result, codCollected ? "Delivered and cash recorded." : "Marked delivered.");
  } catch (error) {
    return actionError(error, "Admin mark delivered");
  }
}

export async function adminCancelOrder(orderId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const reason = z.string().trim().min(3, "Add a short reason for cancelling.").max(300).safeParse(formData.get("reason"));
    if (!id.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
    if (!reason.success) return { ok: false, error: reason.error.issues[0].message };
    const result = await transitionOrder({ orderId, to: "CANCELLED", actor, cancellationReason: reason.data });
    if (result.ok) revalidateOrder(orderId);
    return fromOperation(result, "Order cancelled.");
  } catch (error) {
    return actionError(error, "Admin cancel");
  }
}

const assignSchema = z.object({
  assignee: z.string().regex(/^[^:]{1,64}:[^:]{0,64}$/, "Choose a chef."),
  note: z.string().trim().max(300).optional()
});

export async function adminAssignChef(orderId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const parsed = assignSchema.safeParse({ assignee: formData.get("assignee"), note: formData.get("note") || undefined });
    if (!id.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    // "<chefId>:<kitchenId or empty>"
    const [homeChefId, kitchenId] = parsed.data.assignee.split(":");
    const result = await assignChef({ orderId, homeChefId, kitchenId: kitchenId || null, actor, note: parsed.data.note });
    if (result.ok) revalidateOrder(orderId);
    return fromOperation(result, "Chef assigned.");
  } catch (error) {
    return actionError(error, "Admin assign chef");
  }
}

export async function adminRecordPayment(paymentId: string, formData?: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    if (!id.safeParse(paymentId).success) return { ok: false, error: "Invalid request." };
    const reference = z.string().trim().max(120).optional().safeParse(formData?.get("reference") || undefined);
    const result = await recordOfflinePayment({ paymentId, actor, reference: reference.success ? reference.data : undefined });
    if (result.ok) {
      revalidatePath("/admin", "layout");
      const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { orderId: true } });
      if (payment?.orderId) revalidateOrder(payment.orderId);
    }
    return fromOperation(result, "Payment recorded as received.");
  } catch (error) {
    return actionError(error, "Admin record payment");
  }
}

export async function adminAssignRider(orderId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const riderId = id.safeParse(formData.get("riderId"));
    if (!id.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
    if (!riderId.success) return { ok: false, error: "Choose a rider." };
    const result = await assignRider({ orderId, riderId: riderId.data, actor });
    if (result.ok) revalidateOrder(orderId);
    return fromOperation(result, "Rider assigned.");
  } catch (error) {
    return actionError(error, "Admin assign rider");
  }
}

export async function adminSetDeliveryIssue(orderId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const note = z.string().trim().min(3, "Describe the issue in a few words.").max(300).safeParse(formData.get("issue"));
    if (!id.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
    if (!note.success) return { ok: false, error: note.error.issues[0].message };
    const result = await setDeliveryIssue({ orderId, note: note.data, actor });
    if (result.ok) revalidateOrder(orderId);
    return fromOperation(result, "Issue recorded.");
  } catch (error) {
    return actionError(error, "Admin delivery issue");
  }
}

export async function adminClearDeliveryIssue(orderId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    if (!id.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
    const result = await setDeliveryIssue({ orderId, note: null, actor });
    if (result.ok) revalidateOrder(orderId);
    return fromOperation(result, "Issue cleared.");
  } catch (error) {
    return actionError(error, "Admin clear delivery issue");
  }
}
