import type { UserRole } from "@prisma/client";

/**
 * Role rules shared by server guards and client navigation (no server imports,
 * so client components can use it).
 */

/** Where each role lands after login or from "Go to dashboard" links. */
export function homePathForRole(role: UserRole | string) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "HOME_CHEF":
      return "/chef";
    case "RIDER":
      return "/rider";
    case "CORPORATE_ADMIN":
      return "/dashboard/corporate";
    default:
      return "/dashboard/customer";
  }
}

/**
 * Chef and rider accounts are operational staff: they work in their own portal
 * and never get customer ordering (cart, checkout, plans, corporate requests).
 */
export function isOperationalStaff(role: UserRole | string | null | undefined): role is "HOME_CHEF" | "RIDER" {
  return role === "HOME_CHEF" || role === "RIDER";
}

/** Signed-in roles that can't place customer orders, so never see cart/plan controls. */
export function hidesCustomerOrdering(role: UserRole | string | null | undefined) {
  return role === "ADMIN" || isOperationalStaff(role);
}
