import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Clock, ShoppingBag } from "lucide-react";
import { requireChefPage } from "@/lib/auth/guards";
import { getChefOrder } from "@/lib/orders/chef-queries";
import { PageHeader } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";
import { AssignmentBadge, OrderStatusBadge } from "@/components/orders/status-badges";
import { ChefNextAction, CodNotice } from "@/components/chef/chef-order-card";
import { ChefInactiveNotice } from "@/components/chef/inactive-notice";
import { deliverySlotLabel, formatDateTime, formatDay } from "@/lib/orders/format";

export const metadata = { title: "Kitchen order" };

export default async function ChefOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { chef } = await requireChefPage(`/chef/orders/${id}`);
  if (!chef) return <ChefInactiveNotice />;

  // Scoped to this chef: another kitchen's order id returns 404.
  const order = await getChefOrder(chef.id, id);
  if (!order) notFound();

  const assignment = order.chefAssignments[0];
  const mealCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <Link href="/chef/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-75">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kitchen orders
      </Link>

      <PageHeader
        title={order.orderNumber}
        description={`${order.customerName.split(" ")[0]}${order.companyName ? ` · ${order.companyName}` : ""} · ${order.deliveryArea}, ${order.deliveryCity}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} className="px-3 py-1.5 text-sm" />
            {assignment ? <AssignmentBadge status={assignment.status} /> : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel>
          <PanelTitle icon={ShoppingBag}>What to prepare · {mealCount} meal{mealCount === 1 ? "" : "s"}</PanelTitle>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
                <div>
                  <p className="font-bold">{item.itemName}</p>
                  <p className="text-sm text-muted">{[item.serviceDay, item.itemDetails].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="font-serif text-2xl font-semibold text-primary">× {item.quantity}</p>
              </li>
            ))}
          </ul>
          {order.specialInstructions || assignment?.note ? (
            <div className="mt-5 space-y-2 rounded-2xl bg-primary/5 p-4 text-sm">
              {assignment?.note ? <p><strong>From the team:</strong> {assignment.note}</p> : null}
              {order.specialInstructions ? <p><strong>Customer instructions:</strong> {order.specialInstructions}</p> : null}
            </div>
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelTitle icon={Clock}>Timing</PanelTitle>
            <dl className="grid gap-3 text-sm">
              <div><dt className="text-xs text-muted">Delivery day</dt><dd className="font-semibold">{formatDay(order.deliveryDate)}</dd></div>
              <div><dt className="text-xs text-muted">Delivery time</dt><dd className="font-semibold">{deliverySlotLabel(order.deliverySlot)}</dd></div>
              {order.assignedKitchen ? <div><dt className="text-xs text-muted">Kitchen</dt><dd className="font-semibold">{order.assignedKitchen.name}</dd></div> : null}
              {assignment ? <div><dt className="text-xs text-muted">Assigned</dt><dd className="font-semibold">{formatDateTime(assignment.assignedAt)}</dd></div> : null}
            </dl>
            <div className="mt-4"><CodNotice order={order} /></div>
          </Panel>

          <Panel>
            <PanelTitle icon={ClipboardList}>Next step</PanelTitle>
            <ChefNextAction order={order} />
            {["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) ? <p className="text-sm text-muted">This order has left the kitchen. Thank you!</p> : null}
            {order.status === "CANCELLED" ? <p className="text-sm text-danger">This order was cancelled. Please don&rsquo;t prepare it.</p> : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
