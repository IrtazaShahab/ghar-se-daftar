import Link from "next/link";
import type { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { AlertTriangle, CheckCircle2, Settings2 } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { adminRecordPayment } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-controls";
import { EmptyRow, Field, PageHeader, Pagination, TableShell, Td, Th, fieldClass } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";
import { PaymentStatusBadge } from "@/components/orders/status-badges";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, formatDateTime, formatRs } from "@/lib/orders/format";
import { getProviderById, listProviders } from "@/lib/payments/registry";

export const metadata = { title: "Payments" };

const PAGE_SIZE = 30;
const STATUSES = Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[];
const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];
const ONLINE: PaymentMethod[] = ["EASYPAISA", "JAZZCASH", "CARD"];

type Search = { status?: string; method?: string; kind?: string; page?: string };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminPage("/admin/payments");
  const params = await searchParams;
  const status = STATUSES.find((value) => value === params.status);
  const method = METHODS.find((value) => value === params.method);
  const online = params.kind === "online";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.PaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(method ? { method } : online ? { method: { in: ONLINE } } : {})
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        order: { select: { id: true, orderNumber: true, customerName: true, status: true } },
        corporateQuote: { select: { quoteNumber: true, request: { select: { id: true, companyName: true } } } }
      }
    }),
    prisma.payment.count({ where })
  ]);

  const providers = listProviders().filter((provider) => !provider.offline);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Every payment attempt. Online payments turn paid only after the provider verifies them; cash, bank transfers and invoices are recorded here by an admin." />

      <Panel>
        <PanelTitle icon={Settings2}>Online payment providers</PanelTitle>
        <ul className="grid gap-3 md:grid-cols-3">
          {providers.map((provider) => {
            const providerStatus = provider.getStatus();
            return (
              <li key={provider.id} className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
                <p className="flex items-center gap-2 font-bold">
                  {providerStatus.state === "ready" ? <CheckCircle2 className="size-4 text-success" aria-hidden="true" /> : <AlertTriangle className="size-4 text-orange-600" aria-hidden="true" />}
                  {provider.displayName}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {providerStatus.state === "ready"
                    ? "Live"
                    : providerStatus.state === "configuration_required"
                      ? `Configuration required: ${providerStatus.missingEnv.join(", ")}`
                      : providerStatus.note}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">Until a provider is live, customers see it as “Coming soon” and Cash on Delivery handles orders.</p>
      </Panel>

      <form method="get" className="glass-card flex flex-wrap items-end gap-4 rounded-[22px] p-5">
        <Field label="Status">
          <select name="status" defaultValue={status ?? ""} className={fieldClass}>
            <option value="">All</option>
            {STATUSES.map((value) => <option key={value} value={value}>{PAYMENT_STATUS_LABELS[value]}</option>)}
          </select>
        </Field>
        <Field label="Method">
          <select name="method" defaultValue={method ?? ""} className={fieldClass}>
            <option value="">All</option>
            {METHODS.map((value) => <option key={value} value={value}>{PAYMENT_METHOD_LABELS[value]}</option>)}
          </select>
        </Field>
        <button type="submit" className="focus-ring inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-extrabold text-white hover:bg-[#183f28]">Filter</button>
        <Link href="/admin/payments" className="pb-3 text-sm font-bold text-primary hover:underline">Clear</Link>
      </form>

      <TableShell>
        <thead>
          <tr><Th>For</Th><Th>Method</Th><Th>Amount</Th><Th>Status</Th><Th>Reference</Th><Th>Created</Th><Th></Th></tr>
        </thead>
        <tbody>
          {payments.length === 0 ? <EmptyRow colSpan={7}>No payments match these filters.</EmptyRow> : null}
          {payments.map((payment) => {
            const offline = getProviderById(payment.provider)?.offline ?? false;
            const pending = payment.status === "PENDING" || payment.status === "PROCESSING";
            const codReady = payment.provider !== "cod" || (payment.order && ["OUT_FOR_DELIVERY", "DELIVERED"].includes(payment.order.status));
            return (
              <tr key={payment.id} className="hover:bg-white/60">
                <Td>
                  {payment.order ? (
                    <>
                      <Link href={`/admin/orders/${payment.order.id}`} className="font-bold text-primary hover:underline">{payment.order.orderNumber}</Link>
                      <p className="text-xs text-muted">{payment.order.customerName}</p>
                    </>
                  ) : payment.corporateQuote ? (
                    <>
                      <Link href={`/admin/corporate/${payment.corporateQuote.request.id}`} className="font-bold text-primary hover:underline">{payment.corporateQuote.quoteNumber}</Link>
                      <p className="text-xs text-muted">{payment.corporateQuote.request.companyName}</p>
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </Td>
                <Td>{PAYMENT_METHOD_LABELS[payment.method]}</Td>
                <Td className="font-semibold">{formatRs(payment.amount)}</Td>
                <Td><PaymentStatusBadge status={payment.status} /></Td>
                <Td className="text-xs text-muted">
                  {payment.providerTransactionId ?? payment.providerReference ?? "—"}
                  {payment.paidAt ? <p>Paid {formatDateTime(payment.paidAt)}</p> : null}
                </Td>
                <Td className="text-xs">{formatDateTime(payment.createdAt)}</Td>
                <Td>
                  {offline && pending && codReady ? (
                    <ActionButton
                      action={adminRecordPayment.bind(null, payment.id, undefined)}
                      variant="secondary"
                      confirmMessage={`Record ${formatRs(payment.amount)} (${PAYMENT_METHOD_LABELS[payment.method]}) as received?`}
                    >
                      Record received
                    </ActionButton>
                  ) : null}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>

      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} params={{ status, method, kind: online ? "online" : undefined }} basePath="/admin/payments" />
    </div>
  );
}
