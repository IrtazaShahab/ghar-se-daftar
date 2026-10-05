/**
 * Local SMTP check for application emails. Not a web endpoint; run it from a terminal:
 *
 *   npm run email:test -- you@example.com            # verify login + send samples
 *   npm run email:test -- you@example.com --verify   # verify login only, send nothing
 *
 * Uses the same transport and templates as the app, with sample data. It
 * doesn't touch the database. Reads .env.local the same way Next.js does.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const [recipient, flag] = process.argv.slice(2);
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    console.error("Usage: npm run email:test -- you@example.com [--verify]");
    process.exit(1);
  }

  // Imported after env loading so the transport sees .env.local.
  const { emailConfigurationProblem, sendEmail, verifyEmailTransport } = await import("../src/lib/email/transport");
  const { adminNewOrderEmail, orderReceivedEmail } = await import("../src/lib/email/templates");
  const { getAppUrl } = await import("../src/lib/app-url");
  type OrderWithDetails = import("../src/lib/orders/queries").OrderWithDetails;

  console.log(`EMAIL_PROVIDER=${process.env.EMAIL_PROVIDER ?? "(not set)"}  EMAIL_FROM=${process.env.EMAIL_FROM ?? "(default)"}`);
  console.log(`Links will use: ${getAppUrl()}`);

  const problem = emailConfigurationProblem();
  if (problem) {
    console.error(`✗ Not configured: ${problem}`);
    process.exit(1);
  }

  const check = await verifyEmailTransport();
  if (!check.ok) {
    console.error(`✗ ${check.error}`);
    process.exit(1);
  }
  console.log(`✓ ${check.detail}`);
  if (flag === "--verify") return;

  const now = new Date();
  const sample = {
    id: "sample-order",
    orderNumber: "GSD-TEST00",
    customerName: "Sample Customer",
    customerEmail: recipient,
    customerPhone: "0300 1234567",
    deliveryAddress: "Floor 3, Arfa Software Technology Park, Ferozepur Road",
    deliveryArea: "Gulberg",
    deliveryCity: "Lahore",
    deliveryDate: now,
    deliverySlot: "12:30-13:00",
    subtotal: 350,
    deliveryFee: 100,
    discount: 0,
    totalAmount: 450,
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    status: "PENDING",
    items: [{ id: "i1", itemName: "Chicken Achari", itemDetails: "2 Roti + Salad", serviceDay: "Monday", quantity: 1, unitPrice: 350, lineTotal: 350 }]
  } as unknown as OrderWithDetails; // sample data only; never written anywhere

  const appUrl = getAppUrl();
  const emails = [
    orderReceivedEmail(sample, `${appUrl}/orders/GSD-TEST00`),
    adminNewOrderEmail(sample, `${appUrl}/admin/orders/sample-order`)
  ];

  for (const email of emails) {
    const result = await sendEmail({ to: recipient, subject: `[TEST] ${email.subject}`, html: email.html, text: email.text });
    if (result.status === "sent") console.log(`✓ Sent "[TEST] ${email.subject}"`);
    else {
      console.error(`✗ ${result.status === "skipped" ? result.reason : result.error}`);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) console.log("Check the inbox (and spam folder) for 2 test emails.");
}

main().catch((error: unknown) => {
  console.error("✗ Unexpected error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
