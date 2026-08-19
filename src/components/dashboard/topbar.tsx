import Link from "next/link";
import { User } from "lucide-react";

interface DashboardTopbarProps { userName: string; userEmail?: string; role: string; }

export function DashboardTopbar({ userName, role }: DashboardTopbarProps) {
  const roleDisplay = { CUSTOMER: "Customer", ADMIN: "Administrator", CORPORATE_ADMIN: "Corporate Admin", HOME_CHEF: "Chef" }[role] || role;
  const profileHref = role === "CUSTOMER" ? "/dashboard/customer/profile" : `/dashboard/${role === "ADMIN" ? "admin" : role === "CORPORATE_ADMIN" ? "corporate" : "chef"}`;
  return <Link href={profileHref} className="focus-ring flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-card" aria-label="Open account profile">
    <span className="hidden flex-col items-end sm:flex"><span className="text-sm font-bold text-foreground">{userName}</span><span className="text-xs text-muted">{roleDisplay}</span></span>
    <span className="grid size-10 place-items-center rounded-full bg-primary/10"><User className="size-5 text-primary" /></span>
  </Link>;
}
