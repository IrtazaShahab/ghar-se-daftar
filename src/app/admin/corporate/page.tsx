import Link from "next/link";
import type { CorporateRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { EmptyRow, Field, PageHeader, Pagination, TableShell, Td, Th, fieldClass } from "@/components/admin/ui";
import { CorporateRequestBadge } from "@/components/orders/status-badges";
import { formatDateTime, formatRs } from "@/lib/orders/format";

export const metadata = { title: "Corporate requests" };

const PAGE_SIZE = 30;
const STATUSES: Array<[CorporateRequestStatus, string]> = [
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["QUOTE_SENT", "Quote sent"],
  ["ACCEPTED", "Accepted"],
  ["REJECTED", "Rejected"],
  ["CONVERTED", "Plan active"]
];

export default async function AdminCorporatePage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireAdminPage("/admin/corporate");
  const params = await searchParams;
  const status = STATUSES.find(([value]) => value === params.status)?.[0];
  const q = params.q?.trim().slice(0, 80) || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.CorporateRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
            { contactPerson: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } }
          ]
        }
      : {})
  };

  const [requests, total] = await Promise.all([
    prisma.corporateRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { quotes: { orderBy: { createdAt: "desc" }, take: 1, select: { total: true, status: true } } }
    }),
    prisma.corporateRequest.count({ where })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Corporate requests" description="Review requests, contact the company, send a quotation and track it through to an active plan." />

      <form method="get" className="glass-card flex flex-wrap items-end gap-4 rounded-[22px] p-5">
        <Field label="Search" className="min-w-0 flex-1 basis-56">
          <input name="q" defaultValue={q} placeholder="Reference, company, contact, email" className={fieldClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={status ?? ""} className={fieldClass}>
            <option value="">All</option>
            {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <button type="submit" className="focus-ring inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-extrabold text-white hover:bg-[#183f28]">Filter</button>
        <Link href="/admin/corporate" className="pb-3 text-sm font-bold text-primary hover:underline">Clear</Link>
      </form>

      <TableShell>
        <thead>
          <tr><Th>Reference</Th><Th>Company</Th><Th>Contact</Th><Th>Employees</Th><Th>Area</Th><Th>Latest quote</Th><Th>Status</Th></tr>
        </thead>
        <tbody>
          {requests.length === 0 ? <EmptyRow colSpan={7}>No corporate requests yet.</EmptyRow> : null}
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-white/60">
              <Td>
                <Link href={`/admin/corporate/${request.id}`} className="font-bold text-primary hover:underline">{request.reference}</Link>
                <p className="text-xs text-muted">{formatDateTime(request.createdAt)}</p>
              </Td>
              <Td className="font-semibold">{request.companyName}</Td>
              <Td>
                <p>{request.contactPerson}</p>
                <p className="text-xs text-muted">{request.phone} · {request.email}</p>
              </Td>
              <Td>{request.employees}</Td>
              <Td>{request.area}</Td>
              <Td>{request.quotes[0] ? `${formatRs(request.quotes[0].total)} (${request.quotes[0].status.toLowerCase()})` : <span className="text-muted">—</span>}</Td>
              <Td><CorporateRequestBadge status={request.status} /></Td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} params={{ status, q }} basePath="/admin/corporate" />
    </div>
  );
}
