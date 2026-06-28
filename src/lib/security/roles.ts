export type Role = "CUSTOMER" | "CORPORATE_ADMIN" | "HOME_CHEF" | "OPS_ADMIN" | "SUPER_ADMIN";

export const roleAccess: Record<Role, string[]> = {
  CUSTOMER: ["/dashboard/customer"],
  CORPORATE_ADMIN: ["/dashboard/corporate"],
  HOME_CHEF: ["/dashboard/chef"],
  OPS_ADMIN: ["/dashboard/admin", "/dashboard/admin/menu"],
  SUPER_ADMIN: ["/dashboard"]
};

export function canAccess(role: Role, pathname: string) {
  return roleAccess[role].some((prefix) => pathname.startsWith(prefix));
}
