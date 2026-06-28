import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, ShoppingBag } from "lucide-react";

export default async function CorporateDashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "CORPORATE_ADMIN") redirect("/unauthorized");

  return (
    <DashboardShell role={user.role} userName={user.fullName} userEmail={user.email || undefined}>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold mb-2">Corporate Dashboard</h1>
          <p className="text-muted">Manage your team's meal plans and orders</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
              <Users className="size-5 text-primary" />
            </div>
            <p className="text-muted text-sm">Team Members</p>
            <p className="font-serif text-3xl font-semibold">45</p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag className="size-5 text-primary" />
            </div>
            <p className="text-muted text-sm">This Month Orders</p>
            <p className="font-serif text-3xl font-semibold">320</p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <p className="text-muted text-sm">Monthly Spend</p>
            <p className="font-serif text-3xl font-semibold">Rs.2.1L</p>
          </Card>
        </div>

        <Card>
          <h2 className="font-semibold text-lg mb-4">Coming Soon</h2>
          <p className="text-muted">Corporate team management, invoicing, and order tracking features are being prepared.</p>
        </Card>
      </div>
    </DashboardShell>
  );
}
