import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentUser } from "@/lib/auth/get-user";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Deliveries", template: "%s | Rider | Ghar Se Daftar" },
  robots: { index: false, follow: false }
};

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Signed out: each page's own guard redirects to /login with its exact path as `next`.
  if (!user) return <>{children}</>;
  if (user.role !== "RIDER") redirect("/unauthorized");

  return (
    <DashboardShell role={user.role} userName={user.fullName} userEmail={user.email || undefined}>
      {children}
    </DashboardShell>
  );
}
