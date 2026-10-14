import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { EmptyRow, Field, PageHeader, Pagination, TableShell, Td, Th, fieldClass } from "@/components/admin/ui";
import { formatDateTime, formatRs } from "@/lib/orders/format";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 30;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdminPage("/admin/customers");
  const params = await searchParams;
  const q = params.q?.trim().slice(0, 80) || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { profile: { phone: { contains: q } } },
            { profile: { companyName: { contains: q, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
        emailVerified: true,
        profile: { select: { phone: true, companyName: true, deliveryArea: true } },
        _count: { select: { orders: true } }
      }
    }),
    prisma.user.count({ where })
  ]);

  // Lifetime value from delivered/active orders (cancelled excluded).
  const spend = customers.length
    ? await prisma.order.groupBy({
        by: ["userId"],
        where: { userId: { in: customers.map((customer) => customer.id) }, status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
        _max: { createdAt: true }
      })
    : [];
  const spendByUser = new Map(spend.map((row) => [row.userId, row]));

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${total} customer account${total === 1 ? "" : "s"}.`} />

      <form method="get" className="glass-card flex flex-wrap items-end gap-4 rounded-[22px] p-5">
        <Field label="Search" className="min-w-0 flex-1 basis-60">
          <input name="q" defaultValue={q} placeholder="Name, email, phone or company" className={fieldClass} />
        </Field>
        <button type="submit" className="focus-ring inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-extrabold text-white hover:bg-[#183f28]">Search</button>
      </form>

      <TableShell>
        <thead>
          <tr><Th>Customer</Th><Th>Contact</Th><Th>Company / area</Th><Th>Orders</Th><Th>Spent</Th><Th>Joined</Th></tr>
        </thead>
        <tbody>
          {customers.length === 0 ? <EmptyRow colSpan={6}>No customers found.</EmptyRow> : null}
          {customers.map((customer) => {
            const stats = spendByUser.get(customer.id);
            return (
              <tr key={customer.id} className="hover:bg-white/60">
                <Td>
                  <p className="font-semibold">{customer.fullName}</p>
                  <p className="text-xs text-muted">{customer.status === "ACTIVE" ? (customer.emailVerified ? "Verified" : "Email not verified") : customer.status.toLowerCase()}</p>
                </Td>
                <Td>
                  <p>{customer.email ?? "—"}</p>
                  <p className="text-xs text-muted">{customer.profile?.phone ?? "No phone"}</p>
                </Td>
                <Td>
                  <p>{customer.profile?.companyName ?? "—"}</p>
                  <p className="text-xs text-muted">{customer.profile?.deliveryArea ?? ""}</p>
                </Td>
                <Td>
                  {customer._count.orders > 0 ? (
                    <Link href={`/admin/orders?customer=${customer.id}`} className="font-bold text-primary hover:underline">{customer._count.orders}</Link>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                  {stats?._max.createdAt ? <p className="text-xs text-muted">Last {formatDateTime(stats._max.createdAt)}</p> : null}
                </Td>
                <Td className="font-semibold">{formatRs(stats?._sum.totalAmount ?? 0)}</Td>
                <Td className="text-xs">{formatDateTime(customer.createdAt)}</Td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>

      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} params={{ q }} basePath="/admin/customers" />
    </div>
  );
}
