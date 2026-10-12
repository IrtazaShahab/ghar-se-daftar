import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-user";
import { homePathForRole, isOperationalStaff } from "@/lib/auth/roles";

export { homePathForRole, isOperationalStaff };

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Who performed an action; stored on status history and audit rows. */
export type Actor = { userId: string; role: UserRole };

export class AuthorizationError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

function loginPath(next?: string) {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

/**
 * Page guards. Every protected page calls one of these itself (not only its
 * layout), because layouts are not re-run on client-side navigation.
 */
export async function requireUserPage(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(next));
  return user;
}

/** Customer-only pages (customer dashboard). Other roles go to their own area. */
export async function requireCustomerPage(next = "/dashboard/customer") {
  const user = await requireUserPage(next);
  if (user.role !== "CUSTOMER") redirect(homePathForRole(user.role));
  return user;
}

/**
 * Customer ordering routes (checkout, plans, corporate requests, order pages):
 * chef and rider accounts are sent to their own portal. Anonymous visitors and
 * other roles are left to the page's own handling.
 */
export function redirectOperationalStaff(user: { role: UserRole } | null) {
  if (user && isOperationalStaff(user.role)) redirect(homePathForRole(user.role));
}

export async function requireAdminPage(next = "/admin") {
  const user = await requireUserPage(next);
  if (user.role !== "ADMIN") redirect("/unauthorized");
  return user;
}

/** The HomeChef record linked to a chef account, or null when not linked/inactive. */
export const getChefForUser = cache(async (userId: string) =>
  prisma.homeChef.findFirst({
    where: { userId, isActive: true },
    include: { kitchens: { orderBy: { createdAt: "asc" } } }
  })
);

export async function requireChefPage(next = "/chef") {
  const user = await requireUserPage(next);
  if (user.role !== "HOME_CHEF") redirect("/unauthorized");
  const chef = await getChefForUser(user.id);
  return { user, chef };
}

/**
 * Action guards: return the actor or throw AuthorizationError. Server actions
 * catch it and return a friendly error instead of leaking details.
 */
export async function requireAdminActor(): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new AuthorizationError();
  return { userId: user.id, role: user.role };
}

export async function requireChefActor() {
  const user = await getCurrentUser();
  if (!user || user.role !== "HOME_CHEF") throw new AuthorizationError();
  const chef = await getChefForUser(user.id);
  if (!chef) throw new AuthorizationError("Your chef profile isn't active yet. Please contact the Ghar Se Daftar team.");
  return { actor: { userId: user.id, role: user.role } satisfies Actor, chef };
}

/** The Rider record linked to a rider account, or null when not linked/inactive. */
export const getRiderForUser = cache(async (userId: string) =>
  prisma.rider.findFirst({ where: { userId, isActive: true }, select: { id: true, displayName: true, phone: true } })
);

export async function requireRiderPage(next = "/rider") {
  const user = await requireUserPage(next);
  if (user.role !== "RIDER") redirect("/unauthorized");
  const rider = await getRiderForUser(user.id);
  return { user, rider };
}

/**
 * Rider identity always comes from the session: the rider id is looked up from
 * the signed-in user, never taken from the browser.
 */
export async function requireRiderActor() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RIDER") throw new AuthorizationError();
  const rider = await getRiderForUser(user.id);
  if (!rider) throw new AuthorizationError("Your rider profile isn't active yet. Please contact the Ghar Se Daftar team.");
  return { actor: { userId: user.id, role: user.role } satisfies Actor, rider };
}
