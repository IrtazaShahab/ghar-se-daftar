import { prisma } from "@/lib/db/prisma";

export type AdminKpis = {
  todayOrders: number;
  todayValue: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  outForDelivery: number;
  deliveredToday: number;
  cancelledToday: number;
  codPendingCount: number;
  codPendingAmount: number;
  revenueToday: number;
  onlineToday: number;
  onlineCount: number;
  corporateNew: number;
};

/**
 * Every admin dashboard figure in one round trip (it used to take 8 separate
 * queries). `since` is the only parameter and is bound by Prisma, never
 * interpolated. Timestamps are stored in UTC.
 */
export async function getAdminKpis(since: Date): Promise<AdminKpis> {
  const [row] = await prisma.$queryRaw<Array<Record<keyof AdminKpis, number | bigint>>>`
    WITH bounds AS (SELECT (${since}::timestamptz AT TIME ZONE 'UTC') AS since)
    SELECT
      COUNT(*) FILTER (WHERE o."createdAt" >= b.since)                                   AS "todayOrders",
      COALESCE(SUM(o."totalAmount") FILTER (WHERE o."createdAt" >= b.since), 0)          AS "todayValue",
      COUNT(*) FILTER (WHERE o.status = 'PENDING')                                       AS "pending",
      COUNT(*) FILTER (WHERE o.status = 'CONFIRMED')                                     AS "confirmed",
      COUNT(*) FILTER (WHERE o.status = 'PREPARING')                                     AS "preparing",
      COUNT(*) FILTER (WHERE o.status = 'READY')                                         AS "ready",
      COUNT(*) FILTER (WHERE o.status = 'OUT_FOR_DELIVERY')                              AS "outForDelivery",
      COUNT(*) FILTER (WHERE o.status = 'DELIVERED' AND o."deliveredAt" >= b.since)      AS "deliveredToday",
      COUNT(*) FILTER (WHERE o.status = 'CANCELLED' AND o."cancelledAt" >= b.since)      AS "cancelledToday",
      COUNT(*) FILTER (WHERE o."paymentMethod" = 'COD' AND o."paymentStatus" = 'PENDING' AND o.status <> 'CANCELLED') AS "codPendingCount",
      COALESCE(SUM(o."totalAmount") FILTER (WHERE o."paymentMethod" = 'COD' AND o."paymentStatus" = 'PENDING' AND o.status <> 'CANCELLED'), 0) AS "codPendingAmount",
      (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p WHERE p.status = 'PAID' AND p."paidAt" >= b.since) AS "revenueToday",
      (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p WHERE p.status = 'PAID' AND p."paidAt" >= b.since AND p.method IN ('EASYPAISA', 'JAZZCASH', 'CARD')) AS "onlineToday",
      (SELECT COUNT(*) FROM "Payment" p WHERE p.status = 'PAID' AND p."paidAt" >= b.since AND p.method IN ('EASYPAISA', 'JAZZCASH', 'CARD')) AS "onlineCount",
      (SELECT COUNT(*) FROM "CorporateRequest" r WHERE r.status = 'NEW') AS "corporateNew"
    FROM bounds b
    LEFT JOIN "Order" o ON TRUE
    GROUP BY b.since
  `;

  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)])) as AdminKpis;
}
