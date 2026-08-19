import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { CustomerPageHeader, EmptyState, StatusBadge, formatDate, formatMoney } from "@/components/dashboard/customer-ui";
import { ShoppingBag, MapPin, CalendarDays } from "lucide-react";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const user = (await getCurrentUser())!;
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: { include: { menuOption: true } }, delivery: true } });
  const address = user.addresses[0];
  return <div className="space-y-8"><CustomerPageHeader title="Your orders" description="Track every meal order and its delivery status." />
    {orders.length ? <div className="grid gap-5">{orders.map((order) => <Card key={order.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-muted">Order {order.id.slice(-8).toUpperCase()}</p><p className="mt-1 text-xl font-bold">{formatMoney(order.totalAmount)}</p></div><StatusBadge status={order.status} /></div>
      <div className="mt-5 grid gap-4 border-y border-border py-5 md:grid-cols-3"><div><p className="text-xs text-muted">Placed</p><p className="mt-1 flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" />{formatDate(order.createdAt)}</p></div><div><p className="text-xs text-muted">Delivery</p><p className="mt-1 font-semibold">{formatDate(order.deliveryDate)}</p></div><div><p className="text-xs text-muted">Address</p><p className="mt-1 flex items-start gap-2 font-semibold"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{address ? `${address.label}, ${address.area}, ${address.city}` : user.profile?.officeAddress || "Not recorded"}</p></div></div>
      <div className="mt-5 space-y-3">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.menuOption.name} <span className="text-muted">× {item.quantity}</span></span><span className="font-bold">{formatMoney(item.unitPrice * item.quantity)}</span></div>)}</div>
    </Card>)}</div> : <EmptyState icon={ShoppingBag} title="No orders yet" description="You haven’t placed any orders yet. Browse fresh homemade meals when you’re ready." href="/menu" action="Browse meals" />}
  </div>;
}
