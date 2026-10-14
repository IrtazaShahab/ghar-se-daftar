"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdminActor } from "@/lib/auth/guards";
import { actionError, type ActionResult } from "@/lib/action-result";
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/delivery/status";

/** Same rule as checkout: 10–13 digits, Pakistani formats. */
const phone = z
  .string()
  .trim()
  .min(10, "Enter the rider's phone number.")
  .max(20)
  .refine((value) => /^[+\d\s()-]+$/.test(value) && value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 13, "Enter a valid phone number, e.g. 0300 1234567");

const riderSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the rider's account email."),
  displayName: z.string().trim().min(2, "Enter the rider's name.").max(80),
  phone
});

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Turns an existing customer account into a rider (mirrors adding a chef). The
 * rider signs up first and logs in with their own password. Riders get no admin
 * or kitchen permissions: the RIDER role only opens /rider.
 */
export async function createRider(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const parsed = riderSchema.safeParse({ email: field(formData, "email"), displayName: field(formData, "displayName"), phone: field(formData, "phone") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const data = parsed.data;

    const user = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true, role: true, rider: { select: { id: true } } } });
    if (!user) return { ok: false, error: "No account uses that email. Ask the rider to sign up first, then try again." };
    if (user.role !== "CUSTOMER" && user.role !== "RIDER") return { ok: false, error: "Only customer accounts can become rider accounts." };
    if (user.rider) return { ok: false, error: "That account is already linked to a rider profile." };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { role: "RIDER" } });
      await tx.rider.create({ data: { userId: user.id, displayName: data.displayName, phone: data.phone } });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "RIDER_CREATED", entity: "User", entityId: user.id } });
    });

    revalidatePath("/admin/riders");
    return { ok: true, message: `${data.displayName} can now log in to the rider app.` };
  } catch (error) {
    return actionError(error, "Create rider");
  }
}

/** Deactivating hides the rider from assignment and blocks /rider access. */
export async function setRiderActive(riderId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    if (!z.string().min(1).max(64).safeParse(riderId).success || typeof isActive !== "boolean") return { ok: false, error: "Invalid request." };
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: { id: true, _count: { select: { deliveries: { where: { status: { in: [...ACTIVE_DELIVERY_STATUSES] } } } } } }
    });
    if (!rider) return { ok: false, error: "Rider not found." };
    if (!isActive && rider._count.deliveries > 0) return { ok: false, error: "Reassign this rider's active deliveries first." };

    await prisma.rider.update({ where: { id: rider.id }, data: { isActive } });
    await prisma.auditLog.create({ data: { actorId: actor.userId, action: isActive ? "RIDER_ACTIVATED" : "RIDER_DEACTIVATED", entity: "Rider", entityId: rider.id } });
    revalidatePath("/admin/riders");
    return { ok: true, message: isActive ? "Rider activated." : "Rider deactivated." };
  } catch (error) {
    return actionError(error, "Set rider active");
  }
}
