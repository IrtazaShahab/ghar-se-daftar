"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/auth/get-user";
import { devRateLimit } from "@/lib/security/rate-limit";
import { corporateRequestSchema, type CorporateRequestInput } from "@/lib/validations/corporate";
import { generateCorporateReference, withUniqueReference } from "@/lib/orders/order-number";
import { adminCorporateRequestEmail } from "@/lib/email/templates";
import { adminNotificationRecipients, createInAppNotification, sendNotificationEmail } from "@/lib/notifications/service";
import { getPaymentMethodOptions } from "@/lib/payments/policy";
import { getProviderForMethod } from "@/lib/payments/registry";

export type CorporateRequestResult =
  | { success: true; reference: string }
  | { success: false; error: string; fieldErrors?: Partial<Record<keyof CorporateRequestInput, string>> };

async function clientKey() {
  const requestHeaders = await headers();
  return (requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip") ?? "unknown").split(",")[0].trim();
}

/** Public corporate lead form: validate → store → notify admin. No payment at this stage. */
export async function submitCorporateRequest(input: CorporateRequestInput): Promise<CorporateRequestResult> {
  if (!devRateLimit(`corporate-request:${await clientKey()}`, 5, 10 * 60_000).ok) {
    return { success: false, error: "Too many requests. Please try again in a few minutes." };
  }

  const parsed = corporateRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CorporateRequestInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CorporateRequestInput;
      fieldErrors[key] ??= issue.message;
    }
    return { success: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  try {
    const user = await getCurrentUser();
    const data = parsed.data;
    const request = await withUniqueReference("reference", generateCorporateReference, (reference) =>
      prisma.corporateRequest.create({
        data: {
          reference,
          userId: user?.id ?? null,
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          employees: data.employees,
          area: data.area,
          notes: data.notes || null
        }
      })
    );

    after(async () => {
      await createInAppNotification({
        type: "ADMIN_NEW_CORPORATE_REQUEST",
        audience: "ADMIN",
        subject: `Corporate request ${request.reference}`,
        body: `${request.companyName} · ${request.employees} employees · ${request.area}`,
        dedupeKey: `corporate:${request.id}:new:admin-feed`,
        corporateRequestId: request.id
      });
      await sendNotificationEmail({
        type: "ADMIN_NEW_CORPORATE_REQUEST",
        audience: "ADMIN",
        to: adminNotificationRecipients(),
        email: adminCorporateRequestEmail(request, `${getAppUrl()}/admin/corporate/${request.id}`),
        dedupeKey: `corporate:${request.id}:new:admin-email`,
        corporateRequestId: request.id
      });
    });

    return { success: true, reference: request.reference };
  } catch (error) {
    console.error("Corporate request error:", error instanceof Error ? error.message : error);
    return { success: false, error: "We couldn't submit your request. Please try again or contact us on WhatsApp." };
  }
}

const token = z.string().regex(/^[A-Za-z0-9_-]{32,64}$/);

async function findQuoteByToken(accessToken: string) {
  const quote = await prisma.corporateQuote.findUnique({
    where: { accessToken },
    select: { id: true, status: true, validUntil: true, total: true, requestId: true, quoteNumber: true, request: { select: { companyName: true } } }
  });
  return quote;
}

export type QuoteActionResult = { ok: true } | { ok: false; error: string };

/** Company accepts or declines a quotation from its private link. */
export async function respondToQuote(accessToken: string, decision: "accept" | "reject"): Promise<QuoteActionResult> {
  if (!token.safeParse(accessToken).success) return { ok: false, error: "This quotation link is invalid." };
  if (!devRateLimit(`quote-response:${await clientKey()}`, 10, 60_000).ok) return { ok: false, error: "Please wait a moment and try again." };

  const quote = await findQuoteByToken(accessToken);
  if (!quote) return { ok: false, error: "This quotation link is invalid." };

  if (quote.status !== "SENT") return { ok: false, error: "This quotation has already been answered." };
  if (quote.validUntil < new Date()) {
    await prisma.corporateQuote.update({ where: { id: quote.id }, data: { status: "EXPIRED" } });
    return { ok: false, error: "This quotation has expired. Please contact us for an updated quote." };
  }

  const accepted = decision === "accept";
  await prisma.$transaction(async (tx) => {
    const updated = await tx.corporateQuote.updateMany({
      where: { id: quote.id, status: "SENT" },
      data: accepted ? { status: "ACCEPTED", acceptedAt: new Date() } : { status: "REJECTED", rejectedAt: new Date() }
    });
    if (updated.count !== 1) return;
    await tx.corporateRequest.update({ where: { id: quote.requestId }, data: { status: accepted ? "ACCEPTED" : "REJECTED" } });
  });

  after(() =>
    createInAppNotification({
      type: "CORPORATE_QUOTE_RESPONSE",
      audience: "ADMIN",
      subject: `${quote.request.companyName} ${accepted ? "accepted" : "declined"} quote ${quote.quoteNumber}`,
      dedupeKey: `quote:${quote.id}:${decision}`,
      corporateRequestId: quote.requestId
    })
  );

  revalidatePath(`/corporate/quote/${accessToken}`);
  revalidatePath("/admin/corporate", "layout");
  return { ok: true };
}

const CORPORATE_METHODS = ["BANK_TRANSFER", "EASYPAISA", "CARD", "INVOICE"] as const satisfies readonly PaymentMethod[];

/**
 * After accepting, the company picks how to pay. Offline methods (bank
 * transfer, invoice) create a pending payment the admin marks received;
 * online methods are only offered once their provider is live.
 */
export async function chooseCorporatePayment(accessToken: string, method: (typeof CORPORATE_METHODS)[number]): Promise<QuoteActionResult> {
  if (!token.safeParse(accessToken).success || !CORPORATE_METHODS.includes(method)) return { ok: false, error: "Invalid request." };

  const quote = await findQuoteByToken(accessToken);
  if (!quote) return { ok: false, error: "This quotation link is invalid." };
  if (quote.status !== "ACCEPTED") return { ok: false, error: "Accept the quotation before choosing a payment method." };

  const option = getPaymentMethodOptions({ orderType: "CORPORATE_PLAN", total: quote.total }).find((candidate) => candidate.method === method);
  if (!option?.available) return { ok: false, error: "That payment method isn't available yet. Please choose bank transfer or invoice." };

  const provider = getProviderForMethod(method);
  if (!provider.offline) return { ok: false, error: "Online corporate payments are not available yet." };

  await prisma.$transaction(async (tx) => {
    // Replace any earlier unpaid choice so there is one open payment per quote.
    await tx.payment.updateMany({
      where: { corporateQuoteId: quote.id, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "CANCELLED", failureReason: "Payment method changed" }
    });
    await tx.payment.create({
      data: { corporateQuoteId: quote.id, provider: provider.id, method, amount: quote.total, currency: "PKR", status: "PENDING" }
    });
    await tx.corporateQuote.update({ where: { id: quote.id }, data: { selectedPaymentMethod: method } });
  });

  revalidatePath(`/corporate/quote/${accessToken}`);
  revalidatePath("/admin/corporate", "layout");
  return { ok: true };
}
