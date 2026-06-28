import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { UtensilsCrossed, Clock, TrendingUp } from "lucide-react";

export default async function ChefDashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "HOME_CHEF") redirect("/unauthorized");

  return (
    <DashboardShell role={user.role} userName={user.fullName} userEmail={user.email || undefined}>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold mb-2">Chef Dashboard</h1>
          <p className="text-muted">Manage your daily orders and earnings</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
              <UtensilsCrossed className="size-5 text-primary" />
            </div>
            <p className="text-muted text-sm">Today's Orders</p>
            <p className="font-serif text-3xl font-semibold">16</p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="size-5 text-primary" />
            </div>
            <p className="text-muted text-sm">Pickup Time</p>
            <p className="font-serif text-3xl font-semibold">11:00 AM</p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <p className="text-muted text-sm">This Month Earnings</p>
            <p className="font-serif text-3xl font-semibold">Rs.42K</p>
          </Card>
        </div>

        <Card>
          <h2 className="font-semibold text-lg mb-4">Coming Soon</h2>
          <p className="text-muted">Chef order management, preparation tracking, and earnings dashboard are being prepared.</p>
        </Card>
      </div>
    </DashboardShell>
  );
}
