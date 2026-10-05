/**
 * Menu items belong to a weekday (Monday's menu is cooked on Monday). An item is
 * delivered on the next occurrence of its day in Pakistan time; same-day orders
 * are accepted until the kitchen cutoff.
 */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // Asia/Karachi is UTC+5 with no daylight saving.
export const SAME_DAY_CUTOFF = { hour: 10, minute: 30 };

/** Next delivery date for a menu day, as 12:00 PKT on that date. Null for unknown day names. */
export function nextServiceDate(dayName: string, now: Date = new Date()) {
  const target = DAY_NAMES.findIndex((name) => name.toLowerCase() === dayName.trim().toLowerCase());
  if (target < 0) return null;

  const pkt = new Date(now.getTime() + PKT_OFFSET_MS);
  const minutesNow = pkt.getUTCHours() * 60 + pkt.getUTCMinutes();
  const cutoff = SAME_DAY_CUTOFF.hour * 60 + SAME_DAY_CUTOFF.minute;

  let daysAhead = (target - pkt.getUTCDay() + 7) % 7;
  if (daysAhead === 0 && minutesNow >= cutoff) daysAhead = 7;

  // 12:00 in Pakistan is 07:00 UTC.
  return new Date(Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), pkt.getUTCDate() + daysAhead, 7, 0, 0));
}

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

/** Earliest delivery date across items; falls back to the next working day. */
export function earliestServiceDate(dayNames: string[], now: Date = new Date()) {
  const dates = dayNames.map((day) => nextServiceDate(day, now)).filter((date): date is Date => date !== null);
  if (dates.length > 0) return new Date(Math.min(...dates.map((date) => date.getTime())));
  return nextServiceDate("Monday", now)!;
}
