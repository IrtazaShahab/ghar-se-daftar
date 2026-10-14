/**
 * Pakistan-time date helpers. Delivery days and windows live in
 * service-windows.ts.
 */

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // Asia/Karachi is UTC+5 with no daylight saving.

/** Midnight (Pakistan time) at the start of the day containing `date`. */
export function startOfPktDay(date: Date = new Date()) {
  const pkt = new Date(date.getTime() + PKT_OFFSET_MS);
  return new Date(Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), pkt.getUTCDate()) - PKT_OFFSET_MS);
}

/** Start of a "YYYY-MM-DD" day in Pakistan time, or null if the value is not a valid date. */
export function parsePktDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day) - PKT_OFFSET_MS);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
