"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/db/prisma";
import { profileSettingsSchema, type ProfileSettingsInput } from "@/lib/validations/profile";
import { revalidatePath } from "next/cache";

export async function updateCustomerProfile(input: ProfileSettingsInput) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return { success: false, error: "Your session has expired. Please log in again." };
  const parsed = profileSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Check your details." };
  const data = parsed.data;
  try {
    await prisma.user.update({ where: { id: user.id }, data: { fullName: data.fullName, profile: { upsert: { create: { companyName: data.companyName || null, officeAddress: data.officeAddress || null, deliveryArea: data.deliveryArea || null, deliveryInstructions: data.deliveryInstructions || null }, update: { companyName: data.companyName || null, officeAddress: data.officeAddress || null, deliveryArea: data.deliveryArea || null, deliveryInstructions: data.deliveryInstructions || null } } } } });
    revalidatePath("/dashboard/customer", "layout");
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "We couldn’t save your changes. Please try again." };
  }
}
