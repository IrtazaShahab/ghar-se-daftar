import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Get the current Supabase-authenticated user with app profile data.
 */
export async function getCurrentUser() {
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
    console.error("Get current user error:", error);
    return null;
  }
}

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
