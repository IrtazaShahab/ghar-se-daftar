import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { describeDbError, isTransientDbError, prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Get the current Supabase-authenticated user with app profile data.
 * Cached per request, so layouts, pages and guards share one lookup.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    let user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        profile: true,
        addresses: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    // Support profiles imported before Supabase Auth IDs were used as the
    // Prisma primary key. Email is verified by the active Supabase session.
    if (!user && data.user.email) {
      user = await prisma.user.findUnique({
        where: { email: data.user.email.toLowerCase() },
        include: {
          profile: true,
          addresses: {
            orderBy: { createdAt: "desc" }
          }
        }
      });
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
