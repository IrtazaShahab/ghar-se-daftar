import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CustomerPageHeader, EmptyState, StatusBadge, formatDate, formatMoney } from "@/components/dashboard/customer-ui";
import { CalendarDays, ShoppingBag, UtensilsCrossed, Truck } from "lucide-react";

export const metadata = { title: "Customer Dashboard" };

export default async function CustomerDashboardPage() {
  const user = (await getCurrentUser())!;
  const [orders, activeSubscription, totalOrders, activeOrders] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { items: { include: { menuOption: true } } } }),
    prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, include: { items: { where: { serviceDate: { gte: new Date() } }, orderBy: { serviceDate: "asc" }, take: 1, include: { menuOption: true } } } }),
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, status: { notIn: ["DELIVERED", "CANCELLED"] } } })
  ]);
  const nextDelivery = orders.filter((order) => order.deliveryDate >= new Date() && order.status !== "CANCELLED").sort((a,b) => a.deliveryDate.getTime()-b.deliveryDate.getTime())[0];
  const firstName = user.fullName.split(" ")[0];

  return <div className="space-y-8">
    <CustomerPageHeader title={`Welcome back, ${firstName}`} description="A clear view of your meals, deliveries, and subscription activity." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Active orders", value: String(activeOrders), Icon: ShoppingBag },
        { label: "Current plan", value: activeSubscription ? activeSubscription.planType.replaceAll("_"," ") : "No plan", Icon: UtensilsCrossed },
        { label: "Next delivery", value: nextDelivery ? formatDate(nextDelivery.deliveryDate) : "Not scheduled", Icon: Truck },
        { label: "Total orders", value: String(totalOrders), Icon: CalendarDays }
      ].map(({ label, value, Icon }) => <Card key={label} className="p-5"><Icon className="size-5 text-primary" /><p className="mt-5 text-sm text-muted">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></Card>)}
    </section>
    <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <Card>
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Recent activity</h2><ButtonLink href="/dashboard/customer/orders" variant="ghost" className="h-10 px-3">View all</ButtonLink></div>
        {orders.length ? <div className="mt-5 divide-y divide-border">{orders.map((order) => <div key={order.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-bold">{order.items.map((item) => `${item.menuOption.name} × ${item.quantity}`).join(", ") || "Order"}</p><p className="mt-1 text-xs text-muted">{formatDate(order.createdAt)} · {formatMoney(order.totalAmount)}</p></div><StatusBadge status={order.status} /></div>)}</div> : <div className="py-10 text-center"><p className="font-bold">No activity yet</p><p className="mt-1 text-sm text-muted">Your orders will appear here.</p></div>}
      </Card>
      <Card><h2 className="text-xl font-bold">Current subscription</h2>{activeSubscription ? <div className="mt-5 space-y-3"><StatusBadge status={activeSubscription.status} /><p className="text-2xl font-bold capitalize">{activeSubscription.planType.toLowerCase()} plan</p><p className="text-sm text-muted">Started {formatDate(activeSubscription.startsOn)}</p><p className="text-sm text-muted">{activeSubscription.endsOn ? `Ends ${formatDate(activeSubscription.endsOn)}` : "No end date"}</p><p className="font-bold">{formatMoney(activeSubscription.price)}</p><ButtonLink href="/dashboard/customer/subscriptions" variant="secondary" className="mt-3 w-full">View subscription</ButtonLink></div> : <div className="mt-8"><p className="font-bold">No active subscription</p><p className="mt-2 text-sm text-muted">Choose a plan for a steadier office lunch routine.</p><ButtonLink href="/#plans" className="mt-5 w-full">Explore plans</ButtonLink></div>}</Card>
    </section>
    {!orders.length && !activeSubscription && <EmptyState icon={UtensilsCrossed} title="Ready for your first office lunch?" description="Browse this week’s homemade meals or choose a subscription plan." href="/menu" action="Browse meals" />}
    <Card><h2 className="text-xl font-bold">Quick actions</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><ButtonLink href="/menu">Order now</ButtonLink><ButtonLink href="/dashboard/customer/orders" variant="secondary">View orders</ButtonLink><ButtonLink href="/dashboard/customer/subscriptions" variant="secondary">Subscriptions</ButtonLink><ButtonLink href="/dashboard/customer/profile" variant="secondary">Update profile</ButtonLink></div></Card>
  </div>;
}
