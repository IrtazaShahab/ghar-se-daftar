import type { CorporateQuote, CorporateRequest, OrderStatus } from "@prisma/client";
import type { OrderWithDetails } from "@/lib/orders/queries";
import { ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, deliverySlotLabel, formatDay, formatDeliveryFee, formatRs } from "@/lib/orders/format";
import { emailHeading, emailPanel, emailParagraph, emailRows, escapeHtml, renderEmailLayout } from "./layout";

export type RenderedEmail = { subject: string; html: string; text: string };

function itemsBlock(order: OrderWithDetails) {
  return emailRows(
    order.items.map((item) => ({
      label: `${escapeHtml(item.itemName)}${item.serviceDay ? ` <span style="color:#687166;">(${escapeHtml(item.serviceDay)})</span>` : ""} &times; ${item.quantity}`,
      value: escapeHtml(formatRs(item.lineTotal))
    }))
  );
}

function totalsBlock(order: OrderWithDetails) {
  return emailRows([
    { label: "Subtotal", value: escapeHtml(formatRs(order.subtotal)) },
    { label: "Delivery", value: escapeHtml(formatDeliveryFee(order.deliveryFee)) },
    ...(order.discount > 0 ? [{ label: "Discount", value: `&minus;${escapeHtml(formatRs(order.discount))}` }] : []),
    { label: "Total", value: escapeHtml(formatRs(order.totalAmount)), strong: true, divider: true }
  ]);
}

function paymentAndDeliveryBlock(order: OrderWithDetails) {
  const payment = `${emailHeading("Payment")}${emailRows([
    { label: "Method", value: escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod]) },
    { label: "Status", value: escapeHtml(PAYMENT_STATUS_LABELS[order.paymentStatus]) },
    ...(order.paymentMethod === "COD" && order.paymentStatus !== "PAID"
      ? [{ label: "Amount to pay on delivery", value: escapeHtml(formatRs(order.totalAmount)), strong: true }]
      : [])
  ])}`;

  const delivery = `${emailHeading("Delivery")}${emailParagraph(
    `${escapeHtml(order.deliveryAddress)}<br>${escapeHtml(order.deliveryArea)}, ${escapeHtml(order.deliveryCity)}<br>` +
      `<span style="color:#687166;">${escapeHtml(formatDay(order.deliveryDate))} &middot; preferred slot ${escapeHtml(deliverySlotLabel(order.deliverySlot))}</span>`
  )}`;

  return emailPanel(payment) + emailPanel(delivery);
}

function textSummary(order: OrderWithDetails, trackUrl: string) {
  return [
    `Order ${order.orderNumber}`,
    ...order.items.map((item) => `- ${item.itemName}${item.serviceDay ? ` (${item.serviceDay})` : ""} x${item.quantity}: ${formatRs(item.lineTotal)}`),
    `Subtotal: ${formatRs(order.subtotal)}`,
    `Delivery: ${formatDeliveryFee(order.deliveryFee)}`,
    ...(order.discount > 0 ? [`Discount: -${formatRs(order.discount)}`] : []),
    `Total: ${formatRs(order.totalAmount)}`,
    `Payment: ${PAYMENT_METHOD_LABELS[order.paymentMethod]} (${PAYMENT_STATUS_LABELS[order.paymentStatus]})`,
    `Order status: ${ORDER_STATUS_LABELS[order.status]}`,
    `Delivery address: ${order.deliveryAddress}, ${order.deliveryArea}, ${order.deliveryCity}`,
    "",
    `Track your order: ${trackUrl}`
  ].join("\n");
}

export function orderReceivedEmail(order: OrderWithDetails, trackUrl: string): RenderedEmail {
  const firstName = order.customerName.split(" ")[0] || order.customerName;
  const intro = "Your order has been received successfully. We will keep you updated as your meal is confirmed, prepared and sent for delivery.";

  const html = renderEmailLayout({
    title: `Order Received – ${order.orderNumber}`,
    preheader: `We've received order ${order.orderNumber}.`,
    heading: `Thank you, ${firstName}!`,
    bodyHtml:
      emailParagraph(escapeHtml(intro)) +
      emailParagraph(`Order reference: <strong style="color:#18231b;">${escapeHtml(order.orderNumber)}</strong><br>Order status: <strong style="color:#18231b;">${escapeHtml(ORDER_STATUS_LABELS[order.status])}</strong>`) +
      emailHeading("Your meals") +
      itemsBlock(order) +
      totalsBlock(order) +
      paymentAndDeliveryBlock(order),
    cta: { label: "Track Order", href: trackUrl },
    footnote: "You can follow every step of your order from the tracking page."
  });

  return {
    subject: `Order Received – ${order.orderNumber} | Ghar Se Daftar`,
    html,
    text: `Hi ${firstName},\n\n${intro}\n\n${textSummary(order, trackUrl)}\n\nGhar Se Daftar`
  };
}

const STATUS_SUBJECTS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Order Confirmed",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Order Delivered",
  CANCELLED: "Order Cancelled"
};

export function orderStatusEmail(order: OrderWithDetails, status: OrderStatus, trackUrl: string): RenderedEmail {
  const label = STATUS_SUBJECTS[status] ?? ORDER_STATUS_LABELS[status];
  const description = ORDER_STATUS_DESCRIPTIONS[status];
  const codNote = status === "OUT_FOR_DELIVERY" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID"
    ? emailParagraph(`Please keep <strong style="color:#18231b;">${escapeHtml(formatRs(order.totalAmount))}</strong> ready to pay in cash on delivery.`)
    : "";
  const reason = status === "CANCELLED" && order.cancellationReason ? emailParagraph(`Reason: ${escapeHtml(order.cancellationReason)}`) : "";

  return {
    subject: `${label} – ${order.orderNumber} | Ghar Se Daftar`,
    html: renderEmailLayout({
      title: `${label} – ${order.orderNumber}`,
      preheader: description,
      heading: label,
      bodyHtml: emailParagraph(`Order <strong style="color:#18231b;">${escapeHtml(order.orderNumber)}</strong>: ${escapeHtml(description)}`) + codNote + reason + itemsBlock(order) + totalsBlock(order),
      cta: { label: "Track Order", href: trackUrl }
    }),
    text: `Order ${order.orderNumber}: ${description}\n${status === "CANCELLED" && order.cancellationReason ? `Reason: ${order.cancellationReason}\n` : ""}\nTrack your order: ${trackUrl}`
  };
}

export function paymentReceivedEmail(order: OrderWithDetails, trackUrl: string): RenderedEmail {
  return {
    subject: `Payment Received – ${order.orderNumber} | Ghar Se Daftar`,
    html: renderEmailLayout({
      title: `Payment Received – ${order.orderNumber}`,
      preheader: `We've received ${formatRs(order.totalAmount)} for order ${order.orderNumber}.`,
      heading: "Payment received",
      bodyHtml: emailParagraph(
        `We've received your payment of <strong style="color:#18231b;">${escapeHtml(formatRs(order.totalAmount))}</strong> (${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod])}) for order <strong style="color:#18231b;">${escapeHtml(order.orderNumber)}</strong>. Thank you!`
      ),
      cta: { label: "View Order", href: trackUrl }
    }),
    text: `We've received your payment of ${formatRs(order.totalAmount)} for order ${order.orderNumber}. Thank you!\n\n${trackUrl}`
  };
}

export function adminNewOrderEmail(order: OrderWithDetails, adminUrl: string): RenderedEmail {
  const address = `${order.deliveryAddress}, ${order.deliveryArea}, ${order.deliveryCity}`;
  return {
    subject: `New Order – ${order.orderNumber} | Ghar Se Daftar`,
    html: renderEmailLayout({
      title: `New Order – ${order.orderNumber}`,
      preheader: `${order.customerName} placed an order for ${formatRs(order.totalAmount)}.`,
      heading: `New order ${order.orderNumber}`,
      bodyHtml:
        emailRows([
          { label: "Order", value: escapeHtml(order.orderNumber), strong: true },
          { label: "Customer", value: escapeHtml(order.customerName) },
          { label: "Phone", value: escapeHtml(order.customerPhone) },
          { label: "Total", value: escapeHtml(formatRs(order.totalAmount)), strong: true },
          { label: "Payment", value: `${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod])} (${escapeHtml(PAYMENT_STATUS_LABELS[order.paymentStatus])})` },
          { label: "Area", value: escapeHtml(order.deliveryArea) }
        ]) +
        emailPanel(`${emailHeading("Delivery address")}${emailParagraph(escapeHtml(address))}`) +
        emailHeading("Items") +
        itemsBlock(order),
      cta: { label: "Open Order in Admin", href: adminUrl },
      footnote: "The admin dashboard is the source of truth for this order."
    }),
    text: [
      `New order ${order.orderNumber}`,
      `Customer: ${order.customerName} (${order.customerPhone})`,
      `Total: ${formatRs(order.totalAmount)}`,
      `Payment: ${PAYMENT_METHOD_LABELS[order.paymentMethod]} (${PAYMENT_STATUS_LABELS[order.paymentStatus]})`,
      `Delivery: ${address}`,
      ...order.items.map((item) => `- ${item.itemName} x${item.quantity}`),
      "",
      `Open in admin: ${adminUrl}`
    ].join("\n")
  };
}

export function adminCorporateRequestEmail(request: CorporateRequest, adminUrl: string): RenderedEmail {
  return {
    subject: `Corporate request ${request.reference} – ${request.companyName} (${request.employees} employees)`,
    html: renderEmailLayout({
      title: `Corporate request ${request.reference}`,
      preheader: `${request.companyName} requested a corporate lunch plan.`,
      heading: `New corporate request`,
      bodyHtml: emailRows([
        { label: "Reference", value: escapeHtml(request.reference) },
        { label: "Company", value: escapeHtml(request.companyName) },
        { label: "Contact", value: escapeHtml(request.contactPerson) },
        { label: "Phone", value: escapeHtml(request.phone) },
        { label: "Email", value: escapeHtml(request.email) },
        { label: "Employees", value: escapeHtml(request.employees) },
        { label: "Area", value: escapeHtml(`${request.area}, ${request.city}`) }
      ]),
      cta: { label: "Review Request", href: adminUrl }
    }),
    text: `Corporate request ${request.reference}: ${request.companyName}, ${request.employees} employees, ${request.area}. Contact ${request.contactPerson} ${request.phone} ${request.email}.\n${adminUrl}`
  };
}

export function corporateQuoteEmail(quote: CorporateQuote, request: CorporateRequest, quoteUrl: string): RenderedEmail {
  const validUntil = new Intl.DateTimeFormat("en-PK", { dateStyle: "long", timeZone: "Asia/Karachi" }).format(quote.validUntil);
  const rows = [
    { label: "Price per meal", value: escapeHtml(formatRs(quote.pricePerMeal)) },
    { label: "Meals per day", value: escapeHtml(quote.mealsPerDay) },
    { label: "Service days", value: escapeHtml(`${quote.serviceDays} (${quote.schedule})`) },
    { label: "Subtotal", value: escapeHtml(formatRs(quote.subtotal)) },
    { label: "Delivery charges", value: escapeHtml(formatDeliveryFee(quote.deliveryCharges)) },
    ...(quote.discount > 0 ? [{ label: "Discount", value: `&minus;${escapeHtml(formatRs(quote.discount))}` }] : []),
    { label: "Total", value: escapeHtml(formatRs(quote.total)), strong: true, divider: true }
  ];

  return {
    subject: `Your corporate lunch quotation ${quote.quoteNumber} | Ghar Se Daftar`,
    html: renderEmailLayout({
      title: `Quotation ${quote.quoteNumber}`,
      preheader: `Your customised lunch plan for ${request.companyName}.`,
      heading: `Your lunch plan for ${request.companyName}`,
      bodyHtml:
        emailParagraph(`Dear ${escapeHtml(request.contactPerson)}, thank you for your interest in Ghar Se Daftar. Here is your customised corporate lunch quotation.`) +
        emailRows(rows) +
        (quote.notes ? emailPanel(emailParagraph(escapeHtml(quote.notes))) : "") +
        emailParagraph(`This quotation is valid until <strong style="color:#18231b;">${escapeHtml(validUntil)}</strong>.`),
      cta: { label: "View Quotation", href: quoteUrl }
    }),
    text: `Quotation ${quote.quoteNumber} for ${request.companyName}: total ${formatRs(quote.total)}, valid until ${validUntil}.\nView quotation: ${quoteUrl}`
  };
}
