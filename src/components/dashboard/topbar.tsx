import Link from "next/link";
import { User } from "lucide-react";

interface DashboardTopbarProps { userName: string; userEmail?: string; role: string; }

export function DashboardTopbar({ userName, role }: DashboardTopbarProps) {
  const roleDisplay = { CUSTOMER: "Customer", ADMIN: "Administrator", CORPORATE_ADMIN: "Corporate Admin", HOME_CHEF: "Chef", RIDER: "Rider" }[role] || role;
  const profileHref = { CUSTOMER: "/dashboard/customer/profile", ADMIN: "/admin", HOME_CHEF: "/chef", RIDER: "/rider", CORPORATE_ADMIN: "/dashboard/corporate" }[role] ?? "/";
  return <Link href={profileHref} className="focus-ring flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-card" aria-label="Open account profile">
    <span className="hidden min-w-0 flex-col items-end sm:flex"><span className="max-w-[16rem] truncate text-sm font-bold text-foreground">{userName}</span><span className="text-xs text-muted">{roleDisplay}</span></span>
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10"><User className="size-5 text-primary" /></span>
  </Link>;
}
