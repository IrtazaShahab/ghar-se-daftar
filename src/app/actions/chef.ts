"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireChefActor } from "@/lib/auth/guards";
import { actionError, fromOperation, type ActionResult } from "@/lib/action-result";
import { acceptAssignment, transitionOrder } from "@/lib/orders/operations";

/**
 * Kitchen actions. A chef may only accept, start preparing and mark ready
 * orders assigned to them; operations.ts re-checks the assignment and the
 * lifecycle, and the database trigger rejects any other status jump.
 */

const orderId = z.string().trim().min(1).max(64);

function revalidateKitchen(id: string) {
  revalidatePath("/chef", "layout");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function chefAcceptOrder(id: string): Promise<ActionResult> {
  try {
    const { actor, chef } = await requireChefActor();
    if (!orderId.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const result = await acceptAssignment({ orderId: id, chefId: chef.id, actor });
    if (result.ok) revalidateKitchen(id);
    return fromOperation(result, "Order accepted.");
  } catch (error) {
    return actionError(error, "Chef accept");
  }
}

export async function chefStartPreparing(id: string): Promise<ActionResult> {
  try {
    const { actor, chef } = await requireChefActor();
    if (!orderId.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const result = await transitionOrder({ orderId: id, to: "PREPARING", actor, chefId: chef.id });
    if (result.ok) revalidateKitchen(id);
    return fromOperation(result, "Preparation started.");
  } catch (error) {
    return actionError(error, "Chef start preparing");
  }
}

export async function chefMarkReady(id: string): Promise<ActionResult> {
  try {
    const { actor, chef } = await requireChefActor();
    if (!orderId.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const result = await transitionOrder({ orderId: id, to: "READY", actor, chefId: chef.id });
    if (result.ok) revalidateKitchen(id);
    return fromOperation(result, "Marked ready for pickup.");
  } catch (error) {
    return actionError(error, "Chef mark ready");
  }
}
