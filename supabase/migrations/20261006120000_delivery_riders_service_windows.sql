-- Ghar Se Daftar: riders, live delivery tracking, map pins and configurable
-- delivery windows.
--
-- Additive only: new enum values, nullable columns, two new tables. Existing
-- orders and deliveries are untouched (every new Order/Kitchen column is
-- nullable; new Delivery columns are nullable or have defaults). Safe to re-run:
-- every statement checks whether its change already exists.
--
-- Not applied automatically. Review, back up, then apply (see
-- docs/DELIVERY_AND_RIDERS.md). Rollback: supabase/rollbacks/20261006120000_delivery_riders_service_windows.down.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- New values are not used in this file, so adding them inside the migration
-- transaction is fine on PostgreSQL 12+.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RIDER';
ALTER TYPE "NotificationAudience" ADD VALUE IF NOT EXISTS 'RIDER';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryStatus') THEN
    CREATE TYPE "DeliveryStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED');
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Existing tables: new nullable columns
-- ---------------------------------------------------------------------------

-- Pickup address shown to the assigned rider.
ALTER TABLE "Kitchen" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Checkout map pin (null for orders placed with a typed address only).
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "deliveryLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deliveryLongitude" DOUBLE PRECISION;

ALTER TABLE "Delivery"
  ADD COLUMN IF NOT EXISTS "riderId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "DeliveryStatus" NOT NULL DEFAULT 'ASSIGNED',
  ADD COLUMN IF NOT EXISTS "assignedById" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "issueNote" TEXT,
  ADD COLUMN IF NOT EXISTS "issueReportedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sharingStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lastLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lastAccuracyM" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lastLocationAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rows that existed before riders: delivered orders are DELIVERED, cancelled
-- orders CANCELLED. Rows without a matching order state keep ASSIGNED.
UPDATE "Delivery" d
SET "status" = CASE o.status WHEN 'DELIVERED' THEN 'DELIVERED'::"DeliveryStatus" ELSE 'CANCELLED'::"DeliveryStatus" END
FROM "Order" o
WHERE o.id = d."orderId"
  AND d."riderId" IS NULL
  AND d."status" = 'ASSIGNED'
  AND o.status IN ('DELIVERED', 'CANCELLED');

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Rider" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ServiceWindow" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 60,
    "cutoffMinutes" INTEGER NOT NULL DEFAULT 90,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceWindow_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Indexes and foreign keys
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "Rider_userId_key" ON "Rider"("userId");
CREATE INDEX IF NOT EXISTS "Rider_isActive_idx" ON "Rider"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceWindow_key_key" ON "ServiceWindow"("key");
CREATE INDEX IF NOT EXISTS "Delivery_riderId_status_idx" ON "Delivery"("riderId", "status");
CREATE INDEX IF NOT EXISTS "Delivery_status_idx" ON "Delivery"("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Delivery_riderId_fkey') THEN
    ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_riderId_fkey"
      FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Rider_userId_fkey') THEN
    ALTER TABLE "Rider" ADD CONSTRAINT "Rider_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Integrity: coordinates must be real places; windows must be well formed
-- ---------------------------------------------------------------------------

ALTER TABLE "Delivery" DROP CONSTRAINT IF EXISTS delivery_location_valid;
ALTER TABLE "Delivery" ADD CONSTRAINT delivery_location_valid CHECK (
  ("lastLatitude" IS NULL OR "lastLatitude" BETWEEN -90 AND 90)
  AND ("lastLongitude" IS NULL OR "lastLongitude" BETWEEN -180 AND 180)
  AND ("lastAccuracyM" IS NULL OR "lastAccuracyM" >= 0)
);

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS order_delivery_pin_valid;
ALTER TABLE "Order" ADD CONSTRAINT order_delivery_pin_valid CHECK (
  ("deliveryLatitude" IS NULL AND "deliveryLongitude" IS NULL)
  OR ("deliveryLatitude" BETWEEN -90 AND 90 AND "deliveryLongitude" BETWEEN -180 AND 180)
) NOT VALID;

ALTER TABLE "ServiceWindow" DROP CONSTRAINT IF EXISTS service_window_valid;
ALTER TABLE "ServiceWindow" ADD CONSTRAINT service_window_valid CHECK (
  "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  AND "startTime" < "endTime"
  AND "slotMinutes" BETWEEN 15 AND 240
  AND "cutoffMinutes" BETWEEN 0 AND 1440
);

-- ---------------------------------------------------------------------------
-- Row Level Security: server-only tables (Prisma connects as the table owner).
-- With RLS on and no policy, the Data API (anon/publishable key) cannot read
-- or write them. Delivery already has RLS from the security migration.
-- ---------------------------------------------------------------------------

ALTER TABLE public."Rider" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ServiceWindow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Delivery" ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Default delivery windows (editable later in Admin → Delivery settings).
-- Lunch closes 90 minutes before 12:00, i.e. the existing 10:30 AM same-day cutoff.
-- ---------------------------------------------------------------------------

INSERT INTO "ServiceWindow" ("id", "key", "label", "startTime", "endTime", "slotMinutes", "cutoffMinutes", "isActive", "sortOrder", "updatedAt")
VALUES
  ('service-window-lunch', 'lunch', 'Lunch', '12:00', '16:00', 60, 90, true, 1, CURRENT_TIMESTAMP),
  ('service-window-late-lunch', 'late-lunch', 'Late lunch', '16:00', '18:00', 60, 120, true, 2, CURRENT_TIMESTAMP),
  ('service-window-dinner', 'dinner', 'Dinner', '18:00', '21:00', 60, 120, true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
