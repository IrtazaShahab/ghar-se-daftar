"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdminActor } from "@/lib/auth/guards";
import { actionError, type ActionResult } from "@/lib/action-result";
import { isValidWindow, parseTime } from "@/lib/orders/service-windows";
import { SERVICE_WINDOWS_TAG } from "@/lib/orders/service-windows-db";

const time = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 12:00 or 18:30.");

const windowSchema = z
  .object({
    label: z.string().trim().min(2, "Enter a name, e.g. Lunch.").max(40),
    startTime: time,
    endTime: time,
    slotMinutes: z.coerce.number().int().min(15, "Slots must be at least 15 minutes.").max(240),
    cutoffMinutes: z.coerce.number().int().min(0).max(1440, "Cutoff can be at most 24 hours."),
    sortOrder: z.coerce.number().int().min(0).max(99).default(0),
    isActive: z.boolean()
  })
  .refine((value) => parseTime(value.startTime)! < parseTime(value.endTime)!, { message: "The window must end after it starts.", path: ["endTime"] })
  .refine((value) => isValidWindow(value), { message: "Check the window times and minutes." });

function read(formData: FormData) {
  return windowSchema.safeParse({
    label: formData.get("label"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotMinutes: formData.get("slotMinutes"),
    cutoffMinutes: formData.get("cutoffMinutes"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on"
  });
}

function refresh() {
  // Checkout reads windows through a cross-request cache; drop it now.
  updateTag(SERVICE_WINDOWS_TAG);
  revalidatePath("/admin/settings");
}

export async function updateServiceWindow(windowId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    if (!z.string().min(1).max(64).safeParse(windowId).success) return { ok: false, error: "Invalid request." };
    const parsed = read(formData);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const updated = await prisma.serviceWindow.updateMany({ where: { id: windowId }, data: parsed.data });
    if (updated.count === 0) return { ok: false, error: "Window not found." };
    await prisma.auditLog.create({ data: { actorId: actor.userId, action: "SERVICE_WINDOW_UPDATED", entity: "ServiceWindow", entityId: windowId, metadata: parsed.data } });
    refresh();
    return { ok: true, message: "Saved. Checkout uses the new times now." };
  } catch (error) {
    return actionError(error, "Update service window");
  }
}

export async function createServiceWindow(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const parsed = read(formData);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const key = parsed.data.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "window";

    const created = await prisma.serviceWindow.create({ data: { key, ...parsed.data } });
    await prisma.auditLog.create({ data: { actorId: actor.userId, action: "SERVICE_WINDOW_CREATED", entity: "ServiceWindow", entityId: created.id } });
    refresh();
    return { ok: true, message: `${parsed.data.label} window added.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "A window with that name already exists." };
    return actionError(error, "Create service window");
  }
}
