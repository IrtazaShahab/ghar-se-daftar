import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, ShoppingBag, Users, ClipboardList, TrendingUp, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard",
  description: "Manage orders, menu, customers, and chefs"
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <DashboardShell role={user.role} userName={user.fullName} userEmail={user.email || undefined}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-4xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-muted">Manage platform operations and view key metrics</p>
        </div>

        {/* Key metrics */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag className="size-5 text-primary" />
            </div>
            <p className="text-muted text-sm mb-1">Today's Orders</p>
            <p className="font-serif text-3xl font-semibold">24</p>
            <p className="text-xs text-success mt-2">↑ 12% from yesterday</p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-orange-100 flex items-center justify-center mb-4">
              <AlertCircle className="size-5 text-orange-600" />
            </div>
            <p className="text-muted text-sm mb-1">Pending Confirmations</p>
            <p className="font-serif text-3xl font-semibold">8</p>
            <p className="text-xs text-orange-600 mt-2">Require action</p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-blue-100 flex items-center justify-center mb-4">
              <Users className="size-5 text-blue-600" />
            </div>
            <p className="text-muted text-sm mb-1">Active Subscribers</p>
            <p className="font-serif text-3xl font-semibold">142</p>
            <p className="text-xs text-blue-600 mt-2">↑ 8 new this week</p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[12px] bg-green-100 flex items-center justify-center mb-4">
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-muted text-sm mb-1">Revenue (This Month)</p>
            <p className="font-serif text-3xl font-semibold">Rs.89K</p>
            <p className="text-xs text-green-600 mt-2">↑ 15% from last month</p>
          </Card>
        </div>

        {/* Management sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Orders & Operations */}
          <Card>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              Orders & Operations
            </h2>
            <div className="space-y-3">
              <ButtonLink href="/dashboard/admin/orders" variant="secondary" className="w-full">
                View All Orders
              </ButtonLink>
              <ButtonLink href="/dashboard/admin/orders?status=PENDING_CONFIRMATION" variant="secondary" className="w-full">
                Pending Confirmations (8)
              </ButtonLink>
              <ButtonLink href="/dashboard/admin/orders?status=PREPARING" variant="secondary" className="w-full">
                Currently Preparing
              </ButtonLink>
            </div>
          </Card>

          {/* Content Management */}
          <Card>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Content Management
            </h2>
            <div className="space-y-3">
              <ButtonLink href="/dashboard/admin/menu" variant="secondary" className="w-full">
                Manage Menu
              </ButtonLink>
              <ButtonLink href="/dashboard/admin/customers" variant="secondary" className="w-full">
                Customers
              </ButtonLink>
              <ButtonLink href="/dashboard/admin/chefs" variant="secondary" className="w-full">
                Home Chefs
              </ButtonLink>
            </div>
          </Card>
        </div>

        {/* Recent orders */}
        <Card>
          <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Meals</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "GSD-001", customer: "Ahmed Khan", meals: 2, amount: "Rs.700", status: "CONFIRMED" },
                  { id: "GSD-002", customer: "Fatima Ali", meals: 1, amount: "Rs.350", status: "PENDING_CONFIRMATION" },
                  { id: "GSD-003", customer: "Hassan Raza", meals: 3, amount: "Rs.1050", status: "PREPARING" }
                ].map((order) => {
                  const statusColor = {
                    CONFIRMED: "bg-success/10 text-success",
                    PENDING_CONFIRMATION: "bg-orange-100 text-orange-700",
                    PREPARING: "bg-blue-100 text-blue-700",
                    DELIVERED: "bg-green-100 text-green-700"
                  } as Record<string, string>;

                  return (
                    <tr key={order.id} className="border-b border-border hover:bg-white/50 transition">
                      <td className="py-3 px-4 font-semibold">{order.id}</td>
                      <td className="py-3 px-4">{order.customer}</td>
                      <td className="py-3 px-4 text-muted">{order.meals} meals</td>
                      <td className="py-3 px-4 font-semibold">{order.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[order.status] || ""}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Corporate requests */}
        <Card>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            Corporate Requests
          </h2>
          <div className="py-8 text-center">
            <p className="text-muted mb-4">No pending corporate requests</p>
            <ButtonLink href="/dashboard/admin/corporate" variant="secondary">
              View All Requests
            </ButtonLink>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
