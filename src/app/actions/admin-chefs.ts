"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdminActor } from "@/lib/auth/guards";
import { actionError, type ActionResult } from "@/lib/action-result";

const optional = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);

const chefSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the chef's account email."),
  displayName: z.string().trim().min(2, "Enter a display name.").max(80),
  phone: optional(20),
  area: z.string().trim().min(2, "Enter the chef's area.").max(80),
  city: z.string().trim().min(2).max(60).default("Lahore"),
  specialty: z.string().trim().min(2, "Enter a specialty.").max(160),
  kitchenName: z.string().trim().min(2).max(80).default("Home kitchen")
});

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Turns an existing customer account into a chef and links it to a HomeChef
 * profile with a first kitchen. The person must sign up first, so the chef
 * logs in with their own password. Admin accounts can't be converted here.
 */
export async function createChef(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const parsed = chefSchema.safeParse({
      email: field(formData, "email"),
      displayName: field(formData, "displayName"),
      phone: field(formData, "phone"),
      area: field(formData, "area"),
      city: field(formData, "city"),
      specialty: field(formData, "specialty"),
      kitchenName: field(formData, "kitchenName")
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const data = parsed.data;

    const user = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true, role: true, homeChef: { select: { id: true } } } });
    if (!user) return { ok: false, error: "No account uses that email. Ask the chef to sign up first, then try again." };
    if (user.role === "ADMIN") return { ok: false, error: "Admin accounts can't be converted into chef accounts." };
    if (user.homeChef) return { ok: false, error: "That account is already linked to a chef profile." };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { role: "HOME_CHEF" } });
      await tx.homeChef.create({
        data: {
          userId: user.id,
          displayName: data.displayName,
          phone: data.phone,
          area: data.area,
          city: data.city,
          specialty: data.specialty,
          verified: true,
          kitchens: { create: { name: data.kitchenName, area: data.area, isApproved: true } }
        }
      });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "CHEF_CREATED", entity: "User", entityId: user.id } });
    });

    revalidatePath("/admin/chefs");
    return { ok: true, message: `${data.displayName} can now log in to the kitchen area.` };
  } catch (error) {
    return actionError(error, "Create chef");
  }
}

export async function addKitchen(homeChefId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor();
    const parsed = z
      .object({ name: z.string().trim().min(2, "Enter a kitchen name.").max(80), area: optional(80), address: optional(300) })
      .safeParse({ name: field(formData, "name"), area: field(formData, "area"), address: field(formData, "address") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const chef = await prisma.homeChef.findUnique({ where: { id: homeChefId }, select: { id: true } });
    if (!chef) return { ok: false, error: "Chef not found." };

    await prisma.kitchen.create({ data: { homeChefId: chef.id, name: parsed.data.name, area: parsed.data.area, address: parsed.data.address, isApproved: true } });
    revalidatePath("/admin/chefs");
    return { ok: true, message: "Kitchen added." };
  } catch (error) {
    return actionError(error, "Add kitchen");
  }
}

/** Deactivating hides the chef from assignment and blocks their kitchen access. */
export async function setChefActive(homeChefId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const chef = await prisma.homeChef.findUnique({ where: { id: homeChefId }, select: { id: true } });
    if (!chef) return { ok: false, error: "Chef not found." };

    await prisma.homeChef.update({ where: { id: chef.id }, data: { isActive } });
    await prisma.auditLog.create({ data: { actorId: actor.userId, action: isActive ? "CHEF_ACTIVATED" : "CHEF_DEACTIVATED", entity: "HomeChef", entityId: chef.id } });
    revalidatePath("/admin/chefs");
    return { ok: true, message: isActive ? "Chef activated." : "Chef deactivated." };
  } catch (error) {
    return actionError(error, "Set chef active");
  }
}

/** Pickup address shown to the rider assigned to an order from this kitchen. */
export async function setKitchenAddress(kitchenId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor();
    const parsed = optional(300).safeParse(field(formData, "address"));
    if (!z.string().min(1).max(64).safeParse(kitchenId).success || !parsed.success) return { ok: false, error: "Enter a shorter address." };
    const updated = await prisma.kitchen.updateMany({ where: { id: kitchenId }, data: { address: parsed.data } });
    if (updated.count === 0) return { ok: false, error: "Kitchen not found." };
    revalidatePath("/admin/chefs");
    return { ok: true, message: "Pickup address saved." };
  } catch (error) {
    return actionError(error, "Set kitchen address");
  }
}
