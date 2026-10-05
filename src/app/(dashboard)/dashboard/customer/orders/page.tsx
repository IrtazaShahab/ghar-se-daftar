import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CustomerPageHeader, EmptyState } from "@/components/dashboard/customer-ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { PAYMENT_METHOD_LABELS, formatDateTime, formatDay, formatRs } from "@/lib/orders/format";
import { ShoppingBag, MapPin, CalendarDays } from "lucide-react";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const user = (await getCurrentUser())!;
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { orderBy: { id: "asc" } } }
  });

  return (
    <div className="space-y-8">
      <CustomerPageHeader title="Your orders" description="Track every meal order, its payment and delivery status." />
      {orders.length ? (
        <div className="grid gap-5">
          {orders.map((order) => (
            <Card key={order.id} className="hover:translate-y-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Order {order.orderNumber}</p>
                  <p className="mt-1 text-xl font-bold">{formatRs(order.totalAmount)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>
              <div className="mt-5 grid gap-4 border-y border-border py-5 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted">Placed</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" />{formatDateTime(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Delivery</p>
                  <p className="mt-1 font-semibold">{formatDay(order.deliveryDate)}</p>
                  <p className="text-xs text-muted">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Address</p>
                  <p className="mt-1 flex items-start gap-2 font-semibold"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{order.deliveryAddress}, {order.deliveryArea}</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                    <span>{item.itemName} <span className="text-muted">{item.serviceDay ? `(${item.serviceDay}) ` : ""}× {item.quantity}</span></span>
                    <span className="font-bold">{formatRs(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <ButtonLink href={`/orders/${order.orderNumber}`} variant="secondary" className="mt-5 h-11 w-full sm:w-auto">Track order</ButtonLink>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={ShoppingBag} title="No orders yet" description="You haven’t placed any orders yet. Browse fresh homemade meals when you’re ready." href="/menu" action="Browse meals" />
      )}
    </div>
  );
}
