import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentUser } from "@/lib/auth/get-user";
import { homePathForRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CustomerAreaLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CUSTOMER") redirect(homePathForRole(user.role));

  return <DashboardShell role={user.role} userName={user.fullName} userEmail={user.email || undefined}>{children}</DashboardShell>;
}
