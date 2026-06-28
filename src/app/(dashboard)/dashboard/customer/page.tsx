import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UtensilsCrossed, Calendar, ShoppingBag, MapPin, Phone, Settings } from "lucide-react";

export const metadata = {
  title: "Customer Dashboard",
  description: "Manage your office lunch orders and subscriptions"
};

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CUSTOMER") {
    redirect("/unauthorized");
  }

  return (
    <DashboardShell role={user.role} userName={user.fullName} userEmail={user.email || undefined}>
      <div className="space-y-8">
        {/* Welcome section */}
        <div>
          <h1 className="font-serif text-4xl font-semibold mb-2">Welcome back, {user.fullName}</h1>
          <p className="text-muted">Track your office lunch orders and manage subscriptions</p>
        </div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Active subscription */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="size-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">ACTIVE</span>
            </div>
            <p className="text-muted text-sm mb-1">Active Subscription</p>
            <p className="font-serif text-2xl font-semibold">Weekly Plan</p>
            <p className="text-xs text-muted mt-2">Renews on Jul 4, 2026</p>
          </Card>

          {/* Next meal */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                <Calendar className="size-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">TODAY</span>
            </div>
            <p className="text-muted text-sm mb-1">Today's Meal</p>
            <p className="font-serif text-lg font-semibold">Chicken Karahi</p>
            <p className="text-xs text-muted mt-2">Delivered by 1:00 PM</p>
          </Card>

          {/* Recent orders */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="size-5 text-primary" />
              </div>
            </div>
            <p className="text-muted text-sm mb-1">Total Orders</p>
            <p className="font-serif text-2xl font-semibold">12</p>
            <p className="text-xs text-muted mt-2">This month</p>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Delivery address */}
          <Card>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Delivery Address
            </h2>

            {user.profile?.officeAddress ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted mb-1">Office</p>
                  <p className="font-semibold">{user.profile.companyName || "Your Office"}</p>
                  <p className="text-sm text-muted">{user.profile.deliveryArea}</p>
                  <p className="text-sm text-muted mt-1">{user.profile.officeAddress}</p>
                </div>
                <ButtonLink href="/dashboard/customer/settings" variant="secondary" className="w-full">
                  Update Address
                </ButtonLink>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted text-sm mb-4">No delivery address set</p>
                <ButtonLink href="/dashboard/customer/settings" variant="primary" className="w-full">
                  Add Address
                </ButtonLink>
              </div>
            )}
          </Card>

          {/* Quick links */}
          <Card>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <ButtonLink href="/#menu" variant="secondary" className="w-full">
                Order Now
              </ButtonLink>
              <ButtonLink href="/dashboard/customer/orders" variant="secondary" className="w-full">
                View Orders
              </ButtonLink>
              <ButtonLink href="/dashboard/customer/subscriptions" variant="secondary" className="w-full">
                Manage Plan
              </ButtonLink>
              <ButtonLink href="/dashboard/customer/settings" variant="secondary" className="w-full">
                Settings
              </ButtonLink>
            </div>
          </Card>
        </div>

        {/* Recent orders table */}
        <Card>
          <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Meals</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "GSD-001", meals: "Chicken Karahi (2)", amount: "Rs.700", status: "DELIVERED", date: "Jun 26" },
                  { id: "GSD-002", meals: "Beef Nihari (1)", amount: "Rs.350", status: "DELIVERED", date: "Jun 25" },
                  { id: "GSD-003", meals: "Mix Vegetables (1)", amount: "Rs.350", status: "DELIVERED", date: "Jun 24" }
                ].map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-white/50 transition">
                    <td className="py-3 px-4 font-semibold">{order.id}</td>
                    <td className="py-3 px-4 text-muted">{order.meals}</td>
                    <td className="py-3 px-4 font-semibold">{order.amount}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold bg-success/10 text-success px-2 py-1 rounded-full">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
