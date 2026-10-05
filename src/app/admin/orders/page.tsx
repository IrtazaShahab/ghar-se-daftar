import Link from "next/link";
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { EmptyRow, Field, PageHeader, Pagination, TableShell, Td, Th, fieldClass } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { ALL_ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, formatDateTime, formatDay, formatRs } from "@/lib/orders/format";
import { DAY_MS, parsePktDate, startOfPktDay } from "@/lib/orders/schedule";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 25;
const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[];
const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

type Search = { q?: string; status?: string; payment?: string; method?: string; from?: string; to?: string; range?: string; customer?: string; page?: string };

function pick<T extends string>(value: string | undefined, allowed: readonly T[]) {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminPage("/admin/orders");
  const params = await searchParams;

  const q = params.q?.trim().slice(0, 80) || undefined;
  const status = pick<OrderStatus>(params.status, ALL_ORDER_STATUSES);
  const paymentStatus = pick<PaymentStatus>(params.payment, PAYMENT_STATUSES);
  const method = pick<PaymentMethod>(params.method, PAYMENT_METHODS);
  const from = params.range === "today" ? startOfPktDay() : parsePktDate(params.from);
  const toStart = parsePktDate(params.to);
  const to = toStart ? new Date(toStart.getTime() + DAY_MS) : undefined;
  const customer = params.customer?.trim().slice(0, 64) || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(method ? { paymentMethod: method } : {}),
    ...(customer ? { userId: customer } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q } },
            { deliveryArea: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [orders, total, customerRecord] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        deliveryArea: true,
        deliveryDate: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        assignedChef: { select: { displayName: true } },
        assignedKitchen: { select: { name: true } }
      }
    }),
    prisma.order.count({ where }),
    customer ? prisma.user.findUnique({ where: { id: customer }, select: { fullName: true } }) : null
  ]);

  const filterParams = { q, status, payment: paymentStatus, method, from: params.range === "today" ? undefined : params.from, to: params.to, range: params.range === "today" ? "today" : undefined, customer };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={customerRecord ? `Orders placed by ${customerRecord.fullName}.` : `${total} order${total === 1 ? "" : "s"} match your filters.`}
      />

      <form method="get" className="glass-card grid gap-4 rounded-[22px] p-5 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Search" className="sm:col-span-2">
          <input name="q" defaultValue={q} placeholder="Order #, name, email, phone, area" className={fieldClass} />
        </Field>
        <Field label="Order status">
          <select name="status" defaultValue={status ?? ""} className={fieldClass}>
            <option value="">All</option>
            {ALL_ORDER_STATUSES.map((value) => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}
          </select>
        </Field>
        <Field label="Payment status">
          <select name="payment" defaultValue={paymentStatus ?? ""} className={fieldClass}>
            <option value="">All</option>
            {PAYMENT_STATUSES.map((value) => <option key={value} value={value}>{PAYMENT_STATUS_LABELS[value]}</option>)}
          </select>
        </Field>
        <Field label="Payment method">
          <select name="method" defaultValue={method ?? ""} className={fieldClass}>
            <option value="">All</option>
            {PAYMENT_METHODS.map((value) => <option key={value} value={value}>{PAYMENT_METHOD_LABELS[value]}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1 lg:grid-cols-1">
          <Field label="From"><input type="date" name="from" defaultValue={params.range === "today" ? "" : params.from} className={fieldClass} /></Field>
          <Field label="To"><input type="date" name="to" defaultValue={params.to} className={fieldClass} /></Field>
        </div>
        {customer ? <input type="hidden" name="customer" value={customer} /> : null}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="focus-ring inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-extrabold text-white hover:bg-[#183f28]">Apply filters</button>
          <Link href="/admin/orders" className="text-sm font-bold text-primary hover:underline">Clear</Link>
          {params.range === "today" ? <span className="text-sm text-muted">Showing orders placed today.</span> : null}
        </div>
      </form>

      <TableShell>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Date</Th>
            <Th>Total</Th>
            <Th>Payment</Th>
            <Th>Status</Th>
            <Th>Kitchen / chef</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? <EmptyRow colSpan={7}>No orders match these filters.</EmptyRow> : null}
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-white/60">
              <Td><Link href={`/admin/orders/${order.id}`} className="font-bold text-primary hover:underline">{order.orderNumber}</Link></Td>
              <Td>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-xs text-muted">{order.customerPhone} · {order.deliveryArea}</p>
              </Td>
              <Td>
                <p>{formatDateTime(order.createdAt)}</p>
                <p className="text-xs text-muted">Delivery {formatDay(order.deliveryDate)}</p>
              </Td>
              <Td className="font-semibold">{formatRs(order.totalAmount)}</Td>
              <Td>
                <p className="text-xs text-muted">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                <PaymentStatusBadge status={order.paymentStatus} />
              </Td>
              <Td><OrderStatusBadge status={order.status} /></Td>
              <Td>
                {order.assignedChef ? (
                  <>
                    <p className="font-semibold">{order.assignedChef.displayName}</p>
                    {order.assignedKitchen ? <p className="text-xs text-muted">{order.assignedKitchen.name}</p> : null}
                  </>
                ) : (
                  <span className="text-xs font-semibold text-orange-700">Unassigned</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} params={filterParams} basePath="/admin/orders" />
    </div>
  );
}
