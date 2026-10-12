import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { describeDbError, isTransientDbError, prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const userInclude = {
  profile: true,
  // Only the latest few are ever shown (checkout defaults, profile page).
  addresses: { orderBy: { createdAt: "desc" }, take: 3 }
} satisfies Prisma.UserInclude;

/**
 * Get the current Supabase-authenticated user with app profile data.
 * Cached per request, so layouts, pages and guards share one lookup.
 *
 * The session JWT is verified locally with getClaims() (signature + expiry
 * against the project's cached ES256 public keys) instead of a network call to
 * Supabase Auth on every request. Account status is still read from the
 * database each time, so blocking a user takes effect immediately.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims?.sub) {
      return null;
    }

    let user = await prisma.user.findUnique({ where: { id: claims.sub }, include: userInclude });

    // Support profiles imported before Supabase Auth IDs were used as the
    // Prisma primary key. Email comes from the verified session token.
    if (!user && typeof claims.email === "string" && claims.email) {
      user = await prisma.user.findUnique({ where: { email: claims.email.toLowerCase() }, include: userInclude });
    }

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return user;
  } catch (error) {
    // Let Next.js handle its own control-flow errors (e.g. marking a route dynamic).
    unstable_rethrow(error);
    // A database outage is not "logged out": rethrow so the page's error boundary
    // shows a retry message instead of redirecting to /login.
    if (isTransientDbError(error)) {
      console.error(`Get current user: database unavailable (${describeDbError(error)})`);
      throw error;
    }
    console.error("Get current user error:", error instanceof Error ? error.message : error);
    return null;
  }
});

/**
 * Require authentication - throw if not authenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require a specific app role - throw if wrong role.
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
