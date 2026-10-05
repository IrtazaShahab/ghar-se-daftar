-- Ghar Se Daftar: ordering, payments, kitchen and corporate platform (schema).
--
-- Applies on top of the schema in the previous prisma/schema.prisma. Generated with
-- `prisma migrate diff` and then edited so it is safe on a database that already
-- holds rows (temporary defaults + backfill, legacy DRAFT orders become PENDING).
--
-- If your database has none of the app tables yet, run `npx prisma db push`
-- instead of this file, then run 20260929120100_order_platform_security.sql.
-- After applying, run `npx prisma generate` and `npm run seed`.

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'EASYPAISA', 'JAZZCASH', 'CARD', 'BANK_TRANSFER', 'INVOICE');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('STANDARD', 'CORPORATE');

-- CreateEnum
CREATE TYPE "ChefAssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'REPLACED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('CUSTOMER', 'ADMIN', 'CHEF', 'CORPORATE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CorporateRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTE_SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "CorporateQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ((CASE WHEN "status"::text = 'DRAFT' THEN 'PENDING' ELSE "status"::text END)::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropIndex
DROP INDEX "Order_userId_idx";

-- DropIndex
DROP INDEX "Payment_orderId_key";

-- DropIndex
DROP INDEX "Payment_providerRef_key";

-- DropIndex
DROP INDEX "Payment_status_idx";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "HomeChef" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Kitchen" ADD COLUMN     "area" TEXT,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Home kitchen';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "assignedKitchenId" TEXT,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "customerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerWhatsapp" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryArea" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryCity" TEXT NOT NULL DEFAULT 'Lahore',
ADD COLUMN     "deliveryFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliverySlot" TEXT,
ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "orderNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "specialInstructions" TEXT,
ADD COLUMN     "subtotal" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "itemDetails" TEXT,
ADD COLUMN     "itemName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lineTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serviceDay" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "providerRef",
ADD COLUMN     "corporateQuoteId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "providerReference" TEXT,
ADD COLUMN     "providerTransactionId" TEXT,
ADD COLUMN     "recordedById" TEXT,
ADD COLUMN     "userId" TEXT;

-- Backfill rows created before this migration, then drop the temporary defaults.
UPDATE "Order" SET
  "orderNumber" = 'GSD-' || upper(substr(md5("id"), 1, 6)),
  "subtotal" = "totalAmount"
WHERE "orderNumber" = '';
ALTER TABLE "Order"
  ALTER COLUMN "customerEmail" DROP DEFAULT,
  ALTER COLUMN "customerName" DROP DEFAULT,
  ALTER COLUMN "customerPhone" DROP DEFAULT,
  ALTER COLUMN "deliveryAddress" DROP DEFAULT,
  ALTER COLUMN "deliveryArea" DROP DEFAULT,
  ALTER COLUMN "orderNumber" DROP DEFAULT,
  ALTER COLUMN "subtotal" DROP DEFAULT;
UPDATE "OrderItem" SET "lineTotal" = "unitPrice" * "quantity" WHERE "lineTotal" = 0;
ALTER TABLE "Payment" ALTER COLUMN "method" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "paymentId" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "changedById" TEXT,
    "changedByRole" "UserRole",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChefAssignment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "homeChefId" TEXT NOT NULL,
    "kitchenId" TEXT,
    "status" "ChefAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedById" TEXT,
    "note" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ChefAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "audience" "NotificationAudience" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "orderId" TEXT,
    "corporateRequestId" TEXT,
    "recipient" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "dedupeKey" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "employees" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Lahore',
    "notes" TEXT,
    "status" "CorporateRequestStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "contactedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateQuote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "pricePerMeal" INTEGER NOT NULL,
    "mealsPerDay" INTEGER NOT NULL,
    "serviceDays" INTEGER NOT NULL,
    "schedule" TEXT NOT NULL,
    "deliveryCharges" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "CorporateQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "accessToken" TEXT NOT NULL,
    "selectedPaymentMethod" "PaymentMethod",
    "createdById" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_eventId_key" ON "PaymentEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "ChefAssignment_orderId_idx" ON "ChefAssignment"("orderId");

-- CreateIndex
CREATE INDEX "ChefAssignment_homeChefId_status_idx" ON "ChefAssignment"("homeChefId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_audience_channel_createdAt_idx" ON "Notification"("audience", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_orderId_idx" ON "Notification"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateRequest_reference_key" ON "CorporateRequest"("reference");

-- CreateIndex
CREATE INDEX "CorporateRequest_status_createdAt_idx" ON "CorporateRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateQuote_quoteNumber_key" ON "CorporateQuote"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateQuote_accessToken_key" ON "CorporateQuote"("accessToken");

-- CreateIndex
CREATE INDEX "CorporateQuote_requestId_idx" ON "CorporateQuote"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_paymentMethod_idx" ON "Order"("paymentMethod");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_corporateQuoteId_idx" ON "Payment"("corporateQuoteId");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "Payment"("method");

-- AddForeignKey
ALTER TABLE "HomeChef" ADD CONSTRAINT "HomeChef_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedKitchenId_fkey" FOREIGN KEY ("assignedKitchenId") REFERENCES "Kitchen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_corporateQuoteId_fkey" FOREIGN KEY ("corporateQuoteId") REFERENCES "CorporateQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChefAssignment" ADD CONSTRAINT "ChefAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChefAssignment" ADD CONSTRAINT "ChefAssignment_homeChefId_fkey" FOREIGN KEY ("homeChefId") REFERENCES "HomeChef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChefAssignment" ADD CONSTRAINT "ChefAssignment_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_corporateRequestId_fkey" FOREIGN KEY ("corporateRequestId") REFERENCES "CorporateRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateRequest" ADD CONSTRAINT "CorporateRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateRequest" ADD CONSTRAINT "CorporateRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateQuote" ADD CONSTRAINT "CorporateQuote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CorporateRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

