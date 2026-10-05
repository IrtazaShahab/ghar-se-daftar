import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { Panel, PanelTitle } from "@/components/orders/order-details";
import { CorporateQuoteBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { CorporatePaymentChoice, QuoteDecision } from "@/components/corporate/quote-actions";
import { prisma } from "@/lib/db/prisma";
import { getPaymentMethodOptions } from "@/lib/payments/policy";
import { PAYMENT_METHOD_LABELS, formatDeliveryFee, formatRs } from "@/lib/orders/format";
import { Building2, CheckCircle2, CreditCard, FileText, Landmark } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your corporate quotation", robots: { index: false, follow: false } };

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "long", timeZone: "Asia/Karachi" }).format(date);
}

/** Bank details are server env values, shown only on accepted quotations. */
function bankDetails() {
  const title = process.env.CORPORATE_BANK_ACCOUNT_TITLE?.trim();
  const bank = process.env.CORPORATE_BANK_NAME?.trim();
  const iban = process.env.CORPORATE_BANK_IBAN?.trim();
  return title && bank && iban ? { title, bank, iban } : null;
}

/**
 * Private quotation page. Access is by an unguessable 256-bit token in the URL
 * (sent to the company's email), so no login is needed to review and accept.
 */
export default async function CorporateQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = /^[A-Za-z0-9_-]{32,64}$/.test(token)
    ? await prisma.corporateQuote.findUnique({
        where: { accessToken: token },
        include: {
          request: { select: { companyName: true, contactPerson: true, reference: true, status: true } },
          payments: { where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 1 }
        }
      })
    : null;

  const visible = quote && quote.status !== "DRAFT";
  const expired = Boolean(quote && quote.status === "SENT" && quote.validUntil < new Date());
  const payment = quote?.payments[0] ?? null;
  const bank = bankDetails();

  return (
    <>
      <MarketingNav />
      <main className="container-gsd py-12 md:py-20">
        {!quote || !visible ? (
          <Panel className="mx-auto max-w-md text-center">
            <FileText className="mx-auto size-10 text-primary" aria-hidden="true" />
            <h1 className="mt-4 font-serif text-3xl font-semibold">Quotation not found</h1>
            <p className="mt-2 text-muted">This link is invalid or the quotation is no longer available. Please contact our team.</p>
          </Panel>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Quotation {quote.quoteNumber}</p>
              <h1 className="mt-2 text-balance font-serif text-4xl font-semibold">Lunch plan for {quote.request.companyName}</h1>
              <p className="mt-3 text-muted">Prepared for {quote.request.contactPerson} · request {quote.request.reference}</p>
            </div>

            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <PanelTitle icon={Building2}>Plan details</PanelTitle>
                <CorporateQuoteBadge status={expired ? "EXPIRED" : quote.status} />
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Price per meal</dt><dd className="font-semibold">{formatRs(quote.pricePerMeal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Meals per day</dt><dd className="font-semibold">{quote.mealsPerDay}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Service days</dt><dd className="font-semibold">{quote.serviceDays} ({quote.schedule})</dd></div>
                <div className="flex justify-between border-t border-border pt-3"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatRs(quote.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Delivery charges</dt><dd className="font-semibold">{formatDeliveryFee(quote.deliveryCharges)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="font-semibold">{quote.discount > 0 ? `− ${formatRs(quote.discount)}` : formatRs(0)}</dd></div>
                <div className="flex items-baseline justify-between border-t border-border pt-3"><dt className="font-bold">Total</dt><dd className="font-serif text-3xl font-semibold text-primary">{formatRs(quote.total)}</dd></div>
              </dl>
              {quote.notes ? <p className="mt-5 whitespace-pre-line rounded-2xl bg-primary/5 p-4 text-sm">{quote.notes}</p> : null}
              <p className="mt-4 text-xs text-muted">Valid until {formatLongDate(quote.validUntil)}.</p>
            </Panel>

            {quote.status === "SENT" && !expired ? (
              <Panel>
                <PanelTitle>Your decision</PanelTitle>
                <p className="mb-4 text-sm text-muted">Accepting lets you choose a payment method. Nothing is charged on this page.</p>
                <QuoteDecision token={token} />
              </Panel>
            ) : null}

            {expired ? (
              <Panel className="text-center text-sm text-muted">This quotation has expired. Contact us and we&rsquo;ll prepare an updated one.</Panel>
            ) : null}

            {quote.status === "REJECTED" ? (
              <Panel className="text-center text-sm text-muted">You declined this quotation. Contact us any time for a revised plan.</Panel>
            ) : null}

            {quote.status === "ACCEPTED" ? (
              <>
                <Panel>
                  <p className="flex items-center gap-2 font-bold text-success"><CheckCircle2 className="size-5" aria-hidden="true" />Quotation accepted</p>
                  <p className="mt-2 text-sm text-muted">
                    {quote.request.status === "CONVERTED"
                      ? "Payment received. Your corporate lunch plan is active. Our team will share the delivery schedule."
                      : "Thank you! Choose how you'd like to pay. Your plan is activated once payment is confirmed by our team."}
                  </p>
                </Panel>

                {quote.request.status !== "CONVERTED" ? (
                  <Panel>
                    <PanelTitle icon={CreditCard}>Payment method</PanelTitle>
                    <CorporatePaymentChoice token={token} options={getPaymentMethodOptions({ orderType: "CORPORATE_PLAN", total: quote.total })} selected={quote.selectedPaymentMethod} />
                  </Panel>
                ) : null}

                {payment ? (
                  <Panel>
                    <PanelTitle icon={Landmark}>Next step</PanelTitle>
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      {PAYMENT_METHOD_LABELS[payment.method]} · {formatRs(payment.amount)} <PaymentStatusBadge status={payment.status} />
                    </p>
                    {payment.method === "BANK_TRANSFER" && payment.status !== "PAID" ? (
                      bank ? (
                        <dl className="mt-4 grid gap-2 rounded-2xl bg-card p-4 text-sm">
                          <div><dt className="text-xs text-muted">Account title</dt><dd className="font-semibold">{bank.title}</dd></div>
                          <div><dt className="text-xs text-muted">Bank</dt><dd className="font-semibold">{bank.bank}</dd></div>
                          <div><dt className="text-xs text-muted">IBAN</dt><dd className="break-all font-semibold">{bank.iban}</dd></div>
                          <div><dt className="text-xs text-muted">Payment reference</dt><dd className="font-semibold">{quote.quoteNumber}</dd></div>
                        </dl>
                      ) : (
                        <p className="mt-3 text-sm text-muted">Our team will send you the bank account details. Please use {quote.quoteNumber} as the payment reference.</p>
                      )
                    ) : null}
                    {payment.method === "INVOICE" && payment.status !== "PAID" ? (
                      <p className="mt-3 text-sm text-muted">We&rsquo;ll email a monthly invoice to your team. Your plan starts once billing terms are confirmed.</p>
                    ) : null}
                  </Panel>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
