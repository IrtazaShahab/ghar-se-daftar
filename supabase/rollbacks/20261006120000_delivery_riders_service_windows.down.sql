-- Rollback for supabase/migrations/20261006120000_delivery_riders_service_windows.sql
--
-- Kept outside supabase/migrations so the Supabase CLI never runs it. Run it by
-- hand only after deploying app code that no longer uses riders/windows, and
-- after a backup: it DELETES rider records, live-location data and the
-- configured delivery windows.
--
-- Enum values ('RIDER' on "UserRole" and "NotificationAudience") cannot be
-- dropped in PostgreSQL without recreating the type; they are left in place and
-- are harmless when unused. Move any RIDER accounts back to CUSTOMER first:
--   UPDATE "User" SET role = 'CUSTOMER' WHERE role = 'RIDER';

BEGIN;

ALTER TABLE "Delivery" DROP CONSTRAINT IF EXISTS "Delivery_riderId_fkey";
ALTER TABLE "Delivery" DROP CONSTRAINT IF EXISTS delivery_location_valid;
DROP INDEX IF EXISTS "Delivery_riderId_status_idx";
DROP INDEX IF EXISTS "Delivery_status_idx";

ALTER TABLE "Delivery"
  DROP COLUMN IF EXISTS "riderId",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "assignedById",
  DROP COLUMN IF EXISTS "assignedAt",
  DROP COLUMN IF EXISTS "acceptedAt",
  DROP COLUMN IF EXISTS "cancelledAt",
  DROP COLUMN IF EXISTS "issueNote",
  DROP COLUMN IF EXISTS "issueReportedAt",
  DROP COLUMN IF EXISTS "sharingStartedAt",
  DROP COLUMN IF EXISTS "lastLatitude",
  DROP COLUMN IF EXISTS "lastLongitude",
  DROP COLUMN IF EXISTS "lastAccuracyM",
  DROP COLUMN IF EXISTS "lastLocationAt",
  DROP COLUMN IF EXISTS "createdAt",
  DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS order_delivery_pin_valid;
ALTER TABLE "Order" DROP COLUMN IF EXISTS "deliveryLatitude", DROP COLUMN IF EXISTS "deliveryLongitude";
ALTER TABLE "Kitchen" DROP COLUMN IF EXISTS "address";

DROP TABLE IF EXISTS "Rider";
DROP TABLE IF EXISTS "ServiceWindow";
DROP TYPE IF EXISTS "DeliveryStatus";

COMMIT;
