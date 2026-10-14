"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRiderActor } from "@/lib/auth/guards";
import { actionError, fromOperation, type ActionResult } from "@/lib/action-result";
import { transitionOrder } from "@/lib/orders/operations";
import { acceptDelivery, startLocationSharing, stopLocationSharing } from "@/lib/delivery/operations";

/**
 * Rider actions. The rider id always comes from the signed-in session
 * (requireRiderActor), never from the browser; every operation re-checks that
 * the delivery is assigned to that rider.
 */

const orderId = z.string().trim().min(1).max(64);

function revalidateDelivery(id: string) {
  revalidatePath("/rider", "layout");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/deliveries");
  revalidatePath("/chef", "layout");
}

export async function riderAcceptDelivery(id: string): Promise<ActionResult> {
  try {
    const { actor, rider } = await requireRiderActor();
    if (!orderId.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const result = await acceptDelivery({ orderId: id, riderId: rider.id, actor });
    if (result.ok) revalidateDelivery(id);
    return fromOperation(result, "Delivery accepted.");
  } catch (error) {
    return actionError(error, "Rider accept");
  }
}

/** Collected from the kitchen: the order becomes Out for delivery. */
export async function riderPickUp(id: string): Promise<ActionResult> {
  try {
    const { actor, rider } = await requireRiderActor();
    if (!orderId.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const result = await transitionOrder({ orderId: id, to: "OUT_FOR_DELIVERY", actor, riderId: rider.id });
    if (result.ok) revalidateDelivery(id);
    return fromOperation(result, "Picked up. Drive safe!");
  } catch (error) {
    return actionError(error, "Rider pick up");
  }
}

export async function riderMarkDelivered(id: string, codCollected: boolean): Promise<ActionResult> {
  try {
    const { actor, rider } = await requireRiderActor();
    if (!orderId.safeParse(id).success || typeof codCollected !== "boolean") return { ok: false, error: "Invalid request." };
    const result = await transitionOrder({ orderId: id, to: "DELIVERED", actor, riderId: rider.id, codCollected });
    if (result.ok) revalidateDelivery(id);
    return fromOperation(result, codCollected ? "Delivered and cash recorded." : "Marked delivered.");
  } catch (error) {
    return actionError(error, "Rider mark delivered");
  }
}

/** The rider's explicit consent to share live location for this delivery. */
export async function riderStartSharing(id: string): Promise<ActionResult> {
  try {
    const { actor, rider } = await requireRiderActor();
    if (!orderId.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const result = await startLocationSharing({ orderId: id, riderId: rider.id, actor });
    return fromOperation(result, "Sharing your live location with this customer.");
  } catch (error) {
    return actionError(error, "Rider start sharing");
  }
}

export async function riderStopSharing(id: string): Promise<ActionResult> {
  try {
    const { actor, rider } = await requireRiderActor();
    if (!orderId.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const result = await stopLocationSharing({ orderId: id, riderId: rider.id, actor });
    return fromOperation(result, "Location sharing stopped.");
  } catch (error) {
    return actionError(error, "Rider stop sharing");
  }
}
