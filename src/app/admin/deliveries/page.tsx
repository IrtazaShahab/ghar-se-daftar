import Link from "next/link";
import { AlertTriangle, Bike } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guards";
import { ADMIN_DELIVERY_TABS, ADMIN_DELIVERY_TAB_LABELS, getAdminDeliveryBoard, type AdminDeliveryTab } from "@/lib/delivery/queries";
import { formatAgo, formatEta } from "@/lib/delivery/geo";
import { deliverySlotLabel, formatDay, formatRs } from "@/lib/orders/format";
import { startOfPktDay } from "@/lib/orders/schedule";
import { EmptyRow, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/orders/auto-refresh";
import { DeliveryStatusBadge } from "@/components/orders/delivery-badges";
import { OrderStatusBadge } from "@/components/orders/status-badges";
import { LocalTabs } from "@/components/ui/local-tabs";

export const metadata = { title: "Deliveries" };

const EMPTY: Record<AdminDeliveryTab, string> = {
  "needs-rider": "Every confirmed order has a rider.",
  assigned: "No deliveries waiting for pickup.",
  "on-the-way": "No orders are out for delivery.",
  issues: "No open delivery issues.",
  completed: "Nothing delivered yet today."
};

export default async function AdminDeliveriesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdminPage("/admin/deliveries");
  const { tab } = await searchParams;
  const initial: AdminDeliveryTab = ADMIN_DELIVERY_TABS.find((value) => value === tab) ?? "needs-rider";
  const board = await getAdminDeliveryBoard(startOfPktDay());

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30_000} />
      <PageHeader title="Deliveries" description="Assign riders, watch orders on the way and handle delivery problems. Open an order to assign or contact." />

      <LocalTabs
        label="Delivery status"
        initial={initial}
        tabs={ADMIN_DELIVERY_TABS.map((key) => ({
          key,
          label: ADMIN_DELIVERY_TAB_LABELS[key],
          count: board[key].length,
          content: (
            <TableShell>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Delivery</Th>
                  <Th>Rider</Th>
                  <Th>Live</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {board[key].length === 0 ? <EmptyRow colSpan={5}>{EMPTY[key]}</EmptyRow> : null}
                {board[key].map((row) => (
                  <tr key={row.id} className="hover:bg-white/60">
                    <Td>
                      <Link href={`/admin/orders/${row.id}`} className="font-bold text-primary hover:underline">{row.orderNumber}</Link>
                      <p className="text-xs text-muted">{row.customerName}</p>
                      {row.paymentMethod === "COD" && row.paymentStatus !== "PAID" ? <p className="text-xs font-semibold text-secondary">COD {formatRs(row.totalAmount)}</p> : null}
                    </Td>
                    <Td>
                      <p>{row.deliveryArea}</p>
                      <p className="text-xs text-muted">{formatDay(row.deliveryDate)} · {deliverySlotLabel(row.deliverySlot)}</p>
                      {row.assignedKitchen ? <p className="text-xs text-muted">From {row.assignedKitchen.name}</p> : null}
                    </Td>
                    <Td>
                      {row.riderName ? (
                        <>
                          <p className="flex items-center gap-1.5 font-semibold"><Bike className="size-4 text-primary" aria-hidden="true" />{row.riderName}</p>
                          {row.riderPhone ? <a href={`tel:${row.riderPhone}`} className="text-xs font-bold text-primary hover:underline">{row.riderPhone}</a> : null}
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-orange-700">No rider</span>
                      )}
                      {row.delivery?.issueNote ? (
                        <p className="mt-1 flex items-start gap-1 text-xs font-semibold text-danger">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          <span className="break-words">{row.delivery.issueNote}</span>
                        </p>
                      ) : null}
                    </Td>
                    <Td>
                      {row.status !== "OUT_FOR_DELIVERY" ? (
                        <span className="text-xs text-muted">—</span>
                      ) : row.locationFresh ? (
                        <>
                          <p className="text-xs font-bold text-success">Live</p>
                          <p className="text-xs text-muted">{row.eta ? `ETA ${formatEta(row.eta)}` : "No delivery pin"}</p>
                        </>
                      ) : (
                        <p className="text-xs font-semibold text-orange-700">
                          {row.delivery?.lastLocationAt ? `Stale · ${formatAgo(row.delivery.lastLocationAt)}` : "Not sharing"}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1">
                        <OrderStatusBadge status={row.status} />
                        {row.delivery && row.riderName ? <DeliveryStatusBadge status={row.delivery.status} /> : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )
        }))}
      />
    </div>
  );
}
