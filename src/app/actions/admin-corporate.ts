"use server";

import { randomBytes } from "crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CorporateRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/app-url";
import { requireAdminActor } from "@/lib/auth/guards";
import { actionError, type ActionResult } from "@/lib/action-result";
import { calculateQuoteTotals, corporateQuoteSchema } from "@/lib/validations/corporate";
import { generateQuoteNumber, withUniqueReference } from "@/lib/orders/order-number";
import { corporateQuoteEmail } from "@/lib/email/templates";
import { isEmailConfigured } from "@/lib/email/transport";
import { sendNotificationEmail } from "@/lib/notifications/service";

const REQUEST_STATUSES: CorporateRequestStatus[] = ["NEW", "CONTACTED", "QUOTE_SENT", "ACCEPTED", "REJECTED", "CONVERTED"];

function revalidateRequest(requestId: string) {
  revalidatePath("/admin/corporate");
  revalidatePath(`/admin/corporate/${requestId}`);
  revalidatePath("/admin");
}

export async function updateCorporateRequest(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const parsed = z
      .object({ status: z.enum(REQUEST_STATUSES as [CorporateRequestStatus, ...CorporateRequestStatus[]]), adminNotes: z.string().trim().max(2000).optional() })
      .safeParse({ status: formData.get("status"), adminNotes: formData.get("adminNotes") ?? undefined });
    if (!parsed.success) return { ok: false, error: "Choose a valid status." };

    const request = await prisma.corporateRequest.findUnique({ where: { id: requestId }, select: { id: true, status: true, contactedAt: true } });
    if (!request) return { ok: false, error: "Request not found." };

    const { status, adminNotes } = parsed.data;
    await prisma.corporateRequest.update({
      where: { id: request.id },
      data: {
        status,
        adminNotes: adminNotes || null,
        ...(status === "CONTACTED" && !request.contactedAt ? { contactedAt: new Date() } : {}),
        ...(status === "CONVERTED" ? { convertedAt: new Date() } : {})
      }
    });
    await prisma.auditLog.create({ data: { actorId: actor.userId, action: "CORPORATE_REQUEST_UPDATED", entity: "CorporateRequest", entityId: request.id, metadata: { from: request.status, to: status } } });

    revalidateRequest(request.id);
    return { ok: true, message: "Request updated." };
  } catch (error) {
    return actionError(error, "Update corporate request");
  }
}

function formValues(formData: FormData, names: string[]) {
  return Object.fromEntries(names.map((name) => [name, formData.get(name) ?? undefined]));
}

/** Creates a DRAFT quotation. Totals are always recomputed on the server. */
export async function createCorporateQuote(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const parsed = corporateQuoteSchema.safeParse(
      formValues(formData, ["pricePerMeal", "mealsPerDay", "serviceDays", "schedule", "deliveryCharges", "discount", "validDays", "notes"])
    );
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const request = await prisma.corporateRequest.findUnique({ where: { id: requestId }, select: { id: true, status: true } });
    if (!request) return { ok: false, error: "Request not found." };
    if (request.status === "CONVERTED") return { ok: false, error: "This request is already an active plan." };

    const data = parsed.data;
    const totals = calculateQuoteTotals(data);
    await withUniqueReference("quoteNumber", generateQuoteNumber, (quoteNumber) =>
      prisma.corporateQuote.create({
        data: {
          quoteNumber,
          requestId: request.id,
          pricePerMeal: data.pricePerMeal,
          mealsPerDay: data.mealsPerDay,
          serviceDays: data.serviceDays,
          schedule: data.schedule,
          deliveryCharges: data.deliveryCharges,
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
          validUntil: new Date(Date.now() + data.validDays * 24 * 60 * 60 * 1000),
          notes: data.notes || null,
          accessToken: randomBytes(32).toString("base64url"),
          createdById: actor.userId
        }
      })
    );

    revalidateRequest(request.id);
    return { ok: true, message: "Draft quotation created. Review it, then send it to the company." };
  } catch (error) {
    return actionError(error, "Create corporate quote");
  }
}

/** Marks a draft as sent and emails the private quote link to the company. */
export async function sendCorporateQuote(quoteId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdminActor();
    const quote = await prisma.corporateQuote.findUnique({ where: { id: quoteId }, include: { request: true } });
    if (!quote) return { ok: false, error: "Quotation not found." };
    if (quote.status !== "DRAFT") return { ok: false, error: "Only draft quotations can be sent." };
    if (quote.validUntil < new Date()) return { ok: false, error: "This quotation's validity has passed. Create a new one." };

    await prisma.$transaction(async (tx) => {
      // One live quotation at a time: earlier sent ones are withdrawn.
      await tx.corporateQuote.updateMany({ where: { requestId: quote.requestId, status: "SENT", id: { not: quote.id } }, data: { status: "EXPIRED" } });
      await tx.corporateQuote.update({ where: { id: quote.id }, data: { status: "SENT", sentAt: new Date() } });
      await tx.corporateRequest.update({ where: { id: quote.requestId }, data: { status: "QUOTE_SENT" } });
      await tx.auditLog.create({ data: { actorId: actor.userId, action: "CORPORATE_QUOTE_SENT", entity: "CorporateQuote", entityId: quote.id } });
    });

    const quoteUrl = `${getAppUrl()}/corporate/quote/${quote.accessToken}`;
    after(() =>
      sendNotificationEmail({
        type: "CORPORATE_QUOTE_SENT",
        audience: "CORPORATE",
        to: quote.request.email,
        email: corporateQuoteEmail(quote, quote.request, quoteUrl),
        dedupeKey: `quote:${quote.id}:sent`,
        corporateRequestId: quote.requestId
      })
    );

    revalidateRequest(quote.requestId);
    return {
      ok: true,
      message: isEmailConfigured() ? `Quotation emailed to ${quote.request.email}.` : "Quotation marked as sent. Email isn't configured, so share the link below with the company."
    };
  } catch (error) {
    return actionError(error, "Send corporate quote");
  }
}
