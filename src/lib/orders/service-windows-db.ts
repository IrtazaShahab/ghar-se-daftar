import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_SERVICE_WINDOWS, type ServiceWindowConfig } from "./service-windows";

export const SERVICE_WINDOWS_TAG = "service-windows";

const windowSelect = {
  key: true,
  label: true,
  startTime: true,
  endTime: true,
  slotMinutes: true,
  cutoffMinutes: true,
  isActive: true,
  sortOrder: true
} as const;

/** Every configured window (active or not), for the admin settings page. */
export async function listServiceWindows() {
  return prisma.serviceWindow.findMany({ orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }], select: { id: true, ...windowSelect } });
}

/**
 * Windows used by checkout and order creation. Cached across requests (they
 * rarely change) and dropped by tag when an admin edits them, so checkout does
 * not pay a database round trip for them. Falls back to the defaults when the
 * table is empty.
 */
export const getServiceWindows = unstable_cache(
  async (): Promise<ServiceWindowConfig[]> => {
    const rows = await prisma.serviceWindow.findMany({ select: windowSelect });
    return rows.length > 0 ? rows : [...DEFAULT_SERVICE_WINDOWS];
  },
  ["service-windows-v1"],
  { revalidate: 300, tags: [SERVICE_WINDOWS_TAG] }
);
