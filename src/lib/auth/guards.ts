import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-user";

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

/** Where each role lands after login or from "Go to dashboard" links. */
export function homePathForRole(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "HOME_CHEF":
      return "/chef";
    case "CORPORATE_ADMIN":
      return "/dashboard/corporate";
    default:
      return "/dashboard/customer";
  }
}
