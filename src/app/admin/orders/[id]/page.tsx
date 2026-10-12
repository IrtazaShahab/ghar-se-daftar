import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bike, ChefHat, ClipboardList, CreditCard, History, MapPin, ShoppingBag, User } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { getOrderForAdmin } from "@/lib/orders/queries";
import { ADMIN_ACTION_LABELS, ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from "@/lib/orders/status";
import { PAYMENT_METHOD_LABELS, formatDateTime, formatRs } from "@/lib/orders/format";
import { getProviderById } from "@/lib/payments/registry";
import { adminAssignChef, adminAssignRider, adminCancelOrder, adminClearDeliveryIssue, adminMarkDelivered, adminRecordPayment, adminSetDeliveryIssue, adminTransitionOrder } from "@/app/actions/admin";
import { getAdminTracking, getAssignableRiders } from "@/lib/delivery/queries";
import { RIDER_ASSIGNABLE_ORDER_STATUSES, RIDER_REASSIGNABLE_DELIVERY_STATUSES } from "@/lib/delivery/status";
import { DeliveryTracker } from "@/components/orders/delivery-tracker";
import { LiveOrderBadge, OptimisticStatusProvider } from "@/components/orders/optimistic-status";
import { ActionButton, ActionForm } from "@/components/admin/action-controls";
import { Field, PageHeader, fieldClass } from "@/components/admin/ui";
import { DeliverySummary, OrderItemsTable, Panel, PanelTitle } from "@/components/orders/order-details";
import { AssignmentBadge, PaymentStatusBadge } from "@/components/orders/status-badges";

export const metadata = { title: "Order details" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/orders/${id}`);

  const [order, chefs, riders, tracking] = await Promise.all([
    getOrderForAdmin(id),
    prisma.homeChef.findMany({
      where: { isActive: true, userId: { not: null } },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, area: true, kitchens: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, area: true } } }
    }),
    getAssignableRiders(),
    getAdminTracking(id)
  ]);
  if (!order || !tracking) notFound();

  const nextStatuses = ORDER_TRANSITIONS[order.status];
  const forwardStatuses = nextStatuses.filter((status) => status !== "CANCELLED" && status !== "DELIVERED");
  const canDeliver = nextStatuses.includes("DELIVERED");
  const canCancel = nextStatuses.includes("CANCELLED");
  const canAssign = ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status);
  const codUnpaid = order.paymentMethod === "COD" && order.paymentStatus !== "PAID";
  const activeAssignment = order.chefAssignments.find((assignment) => assignment.status === "ASSIGNED" || assignment.status === "ACCEPTED");
  const delivery = order.delivery?.status === "CANCELLED" ? null : order.delivery;
  const canAssignRider =
    RIDER_ASSIGNABLE_ORDER_STATUSES.includes(order.status) && (!delivery?.riderId || RIDER_REASSIGNABLE_DELIVERY_STATUSES.includes(delivery.status));
  const showDeliveryPanel = order.status !== "PENDING" && order.status !== "CANCELLED";

  return (
    <OptimisticStatusProvider>
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-75">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All orders
      </Link>

      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · last updated ${formatDateTime(order.updatedAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <LiveOrderBadge status={order.status} className="px-3 py-1.5 text-sm" />
            <PaymentStatusBadge status={order.paymentStatus} className="px-3 py-1.5 text-sm" />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
            <Panel>
              <PanelTitle icon={User}>Customer</PanelTitle>
              <dl className="grid gap-4 text-sm">
                <Detail label="Name">{order.customerName}</Detail>
                <Detail label="Email"><a href={`mailto:${order.customerEmail}`} className="break-all text-primary hover:underline">{order.customerEmail}</a></Detail>
                <Detail label="Phone"><a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">{order.customerPhone}</a></Detail>
                {order.customerWhatsapp ? <Detail label="WhatsApp">{order.customerWhatsapp}</Detail> : null}
                {order.userId ? <Link href={`/admin/orders?customer=${order.userId}`} className="text-xs font-bold text-primary hover:underline">All orders from this customer</Link> : null}
              </dl>
            </Panel>
            <Panel>
              <PanelTitle icon={MapPin}>Delivery</PanelTitle>
              <DeliverySummary order={order} />
            </Panel>
          </div>

          <Panel>
            <PanelTitle icon={ShoppingBag}>Items &amp; financials</PanelTitle>
            <OrderItemsTable order={order} />
          </Panel>

          <Panel>
            <PanelTitle icon={CreditCard}>Payment</PanelTitle>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Detail label="Method">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Detail>
              <Detail label="Status"><PaymentStatusBadge status={order.paymentStatus} /></Detail>
              <Detail label="Amount">{formatRs(order.totalAmount)}</Detail>
            </dl>
            <ul className="mt-5 divide-y divide-border rounded-2xl border border-border bg-white/60">
              {order.payments.map((payment) => {
                const offline = getProviderById(payment.provider)?.offline ?? false;
                const recordable = offline && (payment.status === "PENDING" || payment.status === "PROCESSING") && payment.provider !== "cod";
                return (
                  <li key={payment.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold">{PAYMENT_METHOD_LABELS[payment.method]} · {formatRs(payment.amount)} <PaymentStatusBadge status={payment.status} /></p>
                      <p className="mt-1 text-xs text-muted">
                        Provider: {payment.provider}
                        {payment.providerTransactionId ? ` · Txn ${payment.providerTransactionId}` : ""}
                        {payment.providerReference ? ` · Ref ${payment.providerReference}` : ""}
                        {payment.paidAt ? ` · Paid ${formatDateTime(payment.paidAt)}` : ""}
                        {payment.failureReason ? ` · ${payment.failureReason}` : ""}
                      </p>
                    </div>
                    {recordable ? <ActionButton action={adminRecordPayment.bind(null, payment.id, undefined)} variant="secondary">Record received</ActionButton> : null}
                  </li>
                );
              })}
            </ul>
            {codUnpaid && order.status === "DELIVERED" && order.payments[0] ? (
              <div className="mt-4">
                <ActionButton action={adminRecordPayment.bind(null, order.payments[0].id, undefined)} confirmMessage={`Record ${formatRs(order.totalAmount)} cash as collected?`}>
                  Record cash collected · {formatRs(order.totalAmount)}
                </ActionButton>
              </div>
            ) : null}
          </Panel>

          <Panel>
            <PanelTitle icon={History}>Status history</PanelTitle>
            <ol className="space-y-3">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span>
                    <strong>{entry.fromStatus ? `${ORDER_STATUS_LABELS[entry.fromStatus]} → ` : ""}{ORDER_STATUS_LABELS[entry.toStatus]}</strong>
                    <span className="text-muted"> by {entry.changedBy?.fullName ?? (entry.changedByRole ? entry.changedByRole.toLowerCase().replace("_", " ") : "system")}</span>
                    {entry.note ? <span className="block text-xs text-muted">{entry.note}</span> : null}
                  </span>
                  <span className="text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel>
            <PanelTitle icon={ClipboardList}>Actions</PanelTitle>
            {nextStatuses.length === 0 ? (
              <p className="text-sm text-muted">This order is {ORDER_STATUS_LABELS[order.status].toLowerCase()}. No further actions.</p>
            ) : (
              <div className="grid gap-3">
                {forwardStatuses.map((status) => (
                  <ActionButton key={status} action={adminTransitionOrder.bind(null, order.id, status)} optimistic={{ orderStatus: status }} pendingLabel="Updating…">
                    {ADMIN_ACTION_LABELS[status]}
                  </ActionButton>
                ))}
                {canDeliver && codUnpaid ? (
                  <>
                    <ActionButton action={adminMarkDelivered.bind(null, order.id, true)} optimistic={{ orderStatus: "DELIVERED" }} confirmMessage={`Confirm ${formatRs(order.totalAmount)} cash was collected?`}>
                      Mark delivered · cash collected
                    </ActionButton>
                    <ActionButton action={adminMarkDelivered.bind(null, order.id, false)} optimistic={{ orderStatus: "DELIVERED" }} variant="secondary">
                      Mark delivered (cash not yet collected)
                    </ActionButton>
                  </>
                ) : canDeliver ? (
                  <ActionButton action={adminMarkDelivered.bind(null, order.id, false)} optimistic={{ orderStatus: "DELIVERED" }}>Mark delivered</ActionButton>
                ) : null}
                {delivery?.riderId && (order.status === "READY" || order.status === "OUT_FOR_DELIVERY") ? (
                  <p className="text-xs text-muted">The assigned rider normally does this from the rider app; use these only to correct the status.</p>
                ) : null}
                {order.status === "PENDING" && !order.assignedChefId ? (
                  <p className="text-xs text-muted">Tip: confirm the order, then assign a chef so it appears in their kitchen.</p>
                ) : null}
              </div>
            )}
          </Panel>

          {showDeliveryPanel ? (
            <Panel>
              <PanelTitle icon={Bike}>Delivery</PanelTitle>
              <DeliveryTracker orderNumber={order.orderNumber} initial={tracking} admin />

              {canAssignRider ? (
                riders.length === 0 ? (
                  <p className="mt-5 rounded-2xl bg-accent/15 p-4 text-sm text-secondary">
                    No active riders yet. <Link href="/admin/riders" className="font-bold underline">Add a rider</Link> to assign deliveries.
                  </p>
                ) : (
                  <div className="mt-5 border-t border-border pt-5">
                    <ActionForm action={adminAssignRider.bind(null, order.id)} submitLabel={delivery?.riderId ? "Reassign rider" : "Assign rider"} pendingLabel="Assigning…">
                      <Field label="Rider">
                        <select name="riderId" required defaultValue={delivery?.riderId ?? ""} className={fieldClass}>
                          <option value="" disabled>Choose a rider</option>
                          {riders.map((rider) => (
                            <option key={rider.id} value={rider.id}>
                              {rider.displayName} · {rider.activeDeliveries} active
                            </option>
                          ))}
                        </select>
                      </Field>
                    </ActionForm>
                  </div>
                )
              ) : delivery?.riderId && order.status !== "DELIVERED" ? (
                <p className="mt-4 text-xs text-muted">The rider has collected this order, so it can&rsquo;t be reassigned.</p>
              ) : null}

              {delivery?.riderId && order.status !== "DELIVERED" ? (
                <div className="mt-5 border-t border-border pt-5">
                  {delivery.issueNote ? (
                    <ActionButton action={adminClearDeliveryIssue.bind(null, order.id)} variant="secondary" pendingLabel="Clearing…">
                      Mark issue resolved
                    </ActionButton>
                  ) : (
                    <ActionForm action={adminSetDeliveryIssue.bind(null, order.id)} submitLabel="Record delivery issue" submitVariant="secondary" resetOnSuccess>
                      <Field label="Delivery issue (internal)">
                        <input name="issue" required minLength={3} maxLength={300} className={fieldClass} placeholder="e.g. Customer not answering, wrong address" />
                      </Field>
                    </ActionForm>
                  )}
                  <a href={`tel:${order.customerPhone}`} className="mt-3 inline-flex text-xs font-bold text-primary hover:underline">Call customer · {order.customerPhone}</a>
                </div>
              ) : null}
            </Panel>
          ) : null}

          <Panel>
            <PanelTitle icon={ChefHat}>Kitchen &amp; chef</PanelTitle>
            <dl className="grid gap-4 text-sm">
              <Detail label="Assigned chef">{order.assignedChef?.displayName ?? "Not assigned"}</Detail>
              <Detail label="Kitchen">{order.assignedKitchen ? `${order.assignedKitchen.name}${order.assignedKitchen.area ? `, ${order.assignedKitchen.area}` : ""}` : "—"}</Detail>
              {activeAssignment ? (
                <Detail label="Chef response">
                  <AssignmentBadge status={activeAssignment.status} />
                  {activeAssignment.acceptedAt ? <span className="ml-2 text-xs text-muted">{formatDateTime(activeAssignment.acceptedAt)}</span> : null}
                </Detail>
              ) : null}
            </dl>

            {canAssign ? (
              chefs.length === 0 ? (
                <p className="mt-5 rounded-2xl bg-accent/15 p-4 text-sm text-secondary">
                  No active chefs yet. <Link href="/admin/chefs" className="font-bold underline">Add a chef</Link> to assign orders.
                </p>
              ) : (
                <div className="mt-5 border-t border-border pt-5">
                  <ActionForm action={adminAssignChef.bind(null, order.id)} submitLabel={order.assignedChefId ? "Reassign" : "Assign chef"}>
                    <Field label="Chef / kitchen">
                      <select name="assignee" required defaultValue={order.assignedChefId ? `${order.assignedChefId}:${order.assignedKitchenId ?? ""}` : ""} className={fieldClass}>
                        <option value="" disabled>Choose a chef</option>
                        {chefs.map((chef) =>
                          chef.kitchens.length > 0 ? (
                            <optgroup key={chef.id} label={`${chef.displayName} (${chef.area})`}>
                              {chef.kitchens.map((kitchen) => (
                                <option key={kitchen.id} value={`${chef.id}:${kitchen.id}`}>
                                  {chef.displayName} · {kitchen.name}{kitchen.area ? `, ${kitchen.area}` : ""}
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            <option key={chef.id} value={`${chef.id}:`}>{chef.displayName} ({chef.area})</option>
                          )
                        )}
                      </select>
                    </Field>
                    <Field label="Note for chef (optional)">
                      <input name="note" maxLength={300} className={fieldClass} placeholder="e.g. Less spicy, pack separately" />
                    </Field>
                  </ActionForm>
                </div>
              )
            ) : null}
          </Panel>

          {canCancel ? (
            <Panel>
              <PanelTitle>Cancel order</PanelTitle>
              <ActionForm action={adminCancelOrder.bind(null, order.id)} submitLabel="Cancel order" submitVariant="danger" confirmMessage={`Cancel ${order.orderNumber}? The customer will be notified.`}>
                <Field label="Reason (shared with the customer)">
                  <input name="reason" required minLength={3} maxLength={300} className={fieldClass} placeholder="e.g. Kitchen unavailable today" />
                </Field>
              </ActionForm>
              {order.paymentStatus === "PAID" && order.paymentMethod !== "COD" ? (
                <p className="mt-3 text-xs text-muted">This order was paid online. Cancelling keeps the payment as paid so a refund can be issued through the provider.</p>
              ) : null}
            </Panel>
          ) : null}

          {order.status === "CANCELLED" && order.cancellationReason ? (
            <Panel>
              <PanelTitle>Cancellation</PanelTitle>
              <p className="text-sm">{order.cancellationReason}</p>
              {order.cancelledAt ? <p className="mt-1 text-xs text-muted">{formatDateTime(order.cancelledAt)}</p> : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
    </OptimisticStatusProvider>
  );
}
