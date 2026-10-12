import { requireCustomerPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CustomerPageHeader, EmptyState, StatusBadge, formatDate, formatMoney } from "@/components/dashboard/customer-ui";
import { UtensilsCrossed, CalendarDays, MapPin } from "lucide-react";

export const metadata = { title: "My Subscriptions" };

export default async function SubscriptionsPage() {
  const user = await requireCustomerPage("/dashboard/customer/subscriptions");
  const subscriptions = await prisma.subscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: { where: { serviceDate: { gte: new Date() } }, orderBy: { serviceDate: "asc" }, take: 3, include: { menuOption: true } } } });
  return <div className="space-y-8"><CustomerPageHeader title="Subscriptions" description="Review your meal plans and upcoming scheduled meals." />
    {subscriptions.length ? <div className="grid gap-5">{subscriptions.map((subscription) => <Card key={subscription.id}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-muted">Meal plan</p><h2 className="mt-1 text-2xl font-bold capitalize">{subscription.planType.toLowerCase()} plan</h2></div><StatusBadge status={subscription.status} /></div>
      <div className="mt-6 grid gap-4 rounded-2xl bg-primary/5 p-5 sm:grid-cols-3"><div><p className="text-xs text-muted">Price</p><p className="mt-1 font-bold">{formatMoney(subscription.price)}</p></div><div><p className="text-xs text-muted">Started</p><p className="mt-1 font-bold">{formatDate(subscription.startsOn)}</p></div><div><p className="text-xs text-muted">{subscription.endsOn ? "Ends" : "Duration"}</p><p className="mt-1 font-bold">{subscription.endsOn ? formatDate(subscription.endsOn) : "Ongoing"}</p></div></div>
      <div className="mt-6"><h3 className="font-bold">Upcoming meals</h3>{subscription.items.length ? <div className="mt-3 divide-y divide-border">{subscription.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><span><strong>{item.menuOption.name}</strong><span className="ml-2 text-sm text-muted">× {item.quantity}</span></span><span className="text-sm text-muted">{formatDate(item.serviceDate)}</span></div>)}</div> : <p className="mt-2 text-sm text-muted">No upcoming meals are scheduled.</p>}</div>
      <div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/menu" variant="secondary"><CalendarDays className="mr-2 size-4" />View meals</ButtonLink><ButtonLink href="/dashboard/customer/profile" variant="secondary"><MapPin className="mr-2 size-4" />Delivery details</ButtonLink></div>
    </Card>)}</div> : <EmptyState icon={UtensilsCrossed} title="No active subscription" description="Choose a meal plan that works for your office schedule." href="/#plans" action="Explore plans" />}
  </div>;
}
