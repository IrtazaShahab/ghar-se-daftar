import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CreditCard, FileText, NotebookPen } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/app-url";
import { requireAdminPage } from "@/lib/auth/guards";
import { createCorporateQuote, sendCorporateQuote, updateCorporateRequest } from "@/app/actions/admin-corporate";
import { adminRecordPayment } from "@/app/actions/admin";
import { ActionButton, ActionForm } from "@/components/admin/action-controls";
import { Field, PageHeader, fieldClass } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";
import { CorporateQuoteBadge, CorporateRequestBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { PAYMENT_METHOD_LABELS, formatDateTime, formatDeliveryFee, formatRs } from "@/lib/orders/format";

export const metadata = { title: "Corporate request" };

const STATUS_OPTIONS = [
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["QUOTE_SENT", "Quote sent"],
  ["ACCEPTED", "Accepted"],
  ["REJECTED", "Rejected"],
  ["CONVERTED", "Plan active (converted)"]
] as const;

export default async function AdminCorporateRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/corporate/${id}`);

  const request = await prisma.corporateRequest.findUnique({
    where: { id },
    include: { quotes: { orderBy: { createdAt: "desc" }, include: { payments: { orderBy: { createdAt: "desc" } } } } }
  });
  if (!request) notFound();

  const appUrl = getAppUrl();

  return (
    <div className="space-y-6">
      <Link href="/admin/corporate" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-75">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All corporate requests
      </Link>

      <PageHeader title={request.companyName} description={`${request.reference} · received ${formatDateTime(request.createdAt)}`} actions={<CorporateRequestBadge status={request.status} />} />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-6">
          <Panel>
            <PanelTitle icon={Building2}>Request</PanelTitle>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted">Contact person</dt><dd className="mt-1 font-semibold">{request.contactPerson}</dd></div>
              <div><dt className="text-xs text-muted">Phone</dt><dd className="mt-1 font-semibold"><a href={`tel:${request.phone}`} className="text-primary hover:underline">{request.phone}</a></dd></div>
              <div><dt className="text-xs text-muted">Email</dt><dd className="mt-1 font-semibold"><a href={`mailto:${request.email}`} className="text-primary hover:underline">{request.email}</a></dd></div>
              <div><dt className="text-xs text-muted">Employees</dt><dd className="mt-1 font-semibold">{request.employees}</dd></div>
              <div><dt className="text-xs text-muted">Area</dt><dd className="mt-1 font-semibold">{request.area}, {request.city}</dd></div>
              {request.contactedAt ? <div><dt className="text-xs text-muted">First contacted</dt><dd className="mt-1 font-semibold">{formatDateTime(request.contactedAt)}</dd></div> : null}
              {request.notes ? <div className="sm:col-span-2"><dt className="text-xs text-muted">Notes from the company</dt><dd className="mt-1 whitespace-pre-line font-semibold">{request.notes}</dd></div> : null}
            </dl>
          </Panel>

          <Panel>
            <PanelTitle icon={FileText}>Quotations</PanelTitle>
            {request.quotes.length === 0 ? (
              <p className="text-sm text-muted">No quotations yet. Create one with the form once you&rsquo;ve discussed requirements with the company.</p>
            ) : (
              <ul className="space-y-4">
                {request.quotes.map((quote) => {
                  const link = `${appUrl}/corporate/quote/${quote.accessToken}`;
                  return (
                    <li key={quote.id} className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{quote.quoteNumber}</p>
                        <CorporateQuoteBadge status={quote.status} />
                      </div>
                      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div><dt className="text-xs text-muted">Per meal</dt><dd className="font-semibold">{formatRs(quote.pricePerMeal)}</dd></div>
                        <div><dt className="text-xs text-muted">Meals/day × days</dt><dd className="font-semibold">{quote.mealsPerDay} × {quote.serviceDays}</dd></div>
                        <div><dt className="text-xs text-muted">Schedule</dt><dd className="font-semibold">{quote.schedule}</dd></div>
                        <div><dt className="text-xs text-muted">Subtotal</dt><dd className="font-semibold">{formatRs(quote.subtotal)}</dd></div>
                        <div><dt className="text-xs text-muted">Delivery</dt><dd className="font-semibold">{formatDeliveryFee(quote.deliveryCharges)}</dd></div>
                        <div><dt className="text-xs text-muted">Discount</dt><dd className="font-semibold">{formatRs(quote.discount)}</dd></div>
                        <div><dt className="text-xs text-muted">Total</dt><dd className="font-serif text-lg font-semibold text-primary">{formatRs(quote.total)}</dd></div>
                        <div><dt className="text-xs text-muted">Valid until</dt><dd className="font-semibold">{formatDateTime(quote.validUntil)}</dd></div>
                        {quote.selectedPaymentMethod ? <div><dt className="text-xs text-muted">Payment choice</dt><dd className="font-semibold">{PAYMENT_METHOD_LABELS[quote.selectedPaymentMethod]}</dd></div> : null}
                      </dl>
                      {quote.status !== "DRAFT" ? (
                        <p className="mt-3 break-all rounded-xl bg-card px-3 py-2 text-xs">
                          Company link: <a href={link} className="font-semibold text-primary underline" target="_blank" rel="noreferrer">{link}</a>
                        </p>
                      ) : null}
                      {quote.status === "DRAFT" ? (
                        <div className="mt-3">
                          <ActionButton action={sendCorporateQuote.bind(null, quote.id)} confirmMessage={`Send ${quote.quoteNumber} (${formatRs(quote.total)}) to ${request.email}?`}>
                            Send to company
                          </ActionButton>
                        </div>
                      ) : null}
                      {quote.payments.length > 0 ? (
                        <ul className="mt-3 space-y-2 border-t border-border pt-3">
                          {quote.payments.map((payment) => (
                            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <CreditCard className="size-4 text-primary" aria-hidden="true" />
                                {PAYMENT_METHOD_LABELS[payment.method]} · {formatRs(payment.amount)} <PaymentStatusBadge status={payment.status} />
                              </span>
                              {payment.status === "PENDING" ? (
                                <ActionButton action={adminRecordPayment.bind(null, payment.id, undefined)} variant="secondary" confirmMessage={`Record ${formatRs(payment.amount)} as received? This activates the corporate plan.`}>
                                  Record payment received
                                </ActionButton>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelTitle icon={NotebookPen}>Status &amp; notes</PanelTitle>
            <ActionForm action={updateCorporateRequest.bind(null, request.id)} submitLabel="Save">
              <Field label="Status">
                <select name="status" defaultValue={request.status} className={fieldClass}>
                  {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Internal notes">
                <textarea name="adminNotes" defaultValue={request.adminNotes ?? ""} maxLength={2000} rows={4} className={`${fieldClass} h-auto py-2`} placeholder="Call summary, tasting date, decision makers…" />
              </Field>
            </ActionForm>
          </Panel>

          {request.status !== "CONVERTED" ? (
            <Panel>
              <PanelTitle icon={FileText}>New quotation</PanelTitle>
              <ActionForm action={createCorporateQuote.bind(null, request.id)} submitLabel="Create draft quotation" resetOnSuccess>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price per meal (Rs.)"><input name="pricePerMeal" type="number" min={1} required defaultValue={350} className={fieldClass} /></Field>
                  <Field label="Meals per day"><input name="mealsPerDay" type="number" min={1} required defaultValue={request.employees} className={fieldClass} /></Field>
                  <Field label="Service days"><input name="serviceDays" type="number" min={1} required defaultValue={22} className={fieldClass} /></Field>
                  <Field label="Schedule"><input name="schedule" required defaultValue="Mon–Fri" className={fieldClass} /></Field>
                  <Field label="Delivery charges (Rs.)"><input name="deliveryCharges" type="number" min={0} required defaultValue={0} className={fieldClass} /></Field>
                  <Field label="Discount (Rs.)"><input name="discount" type="number" min={0} required defaultValue={0} className={fieldClass} /></Field>
                  <Field label="Valid for (days)" className="col-span-2"><input name="validDays" type="number" min={1} max={90} required defaultValue={14} className={fieldClass} /></Field>
                </div>
                <Field label="Notes for the company (optional)">
                  <textarea name="notes" maxLength={1000} rows={3} className={`${fieldClass} h-auto py-2`} placeholder="Menu rotation, tasting session, billing terms…" />
                </Field>
                <p className="text-xs text-muted">Subtotal = price × meals per day × service days. Totals are calculated on the server.</p>
              </ActionForm>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
