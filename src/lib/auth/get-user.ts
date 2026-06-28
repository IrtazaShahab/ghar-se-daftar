import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";

// TODO: Move sessions to database when ready
const SESSIONS: Map<string, { userId: string; expiresAt: number }> = new Map();

/**
 * Get current user from session cookie (server-side only)
 * Returns null if not authenticated or session expired
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return null;
    }

    // Check session validity
    const session = SESSIONS.get(sessionToken);
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        addresses: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

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
 * Require authentication - throw if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require specific role - throw if wrong role
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
