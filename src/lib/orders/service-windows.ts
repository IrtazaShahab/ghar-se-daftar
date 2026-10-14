/**
 * Delivery windows and slots. Pure functions shared by checkout (display) and
 * order creation (authoritative). Windows come from the ServiceWindow table
 * (Admin → Delivery settings); DEFAULT_SERVICE_WINDOWS is only the fallback
 * when the table is empty.
 *
 * Rules:
 * - A menu item is cooked and delivered on its weekday (Pakistan time).
 * - Same-day orders for a window close `cutoffMinutes` before the window starts
 *   (lunch 12:00 with 90 minutes keeps the original 10:30 AM cutoff).
 * - If no window is still open today, today's menu item moves to next week.
 * - The customer picks one preferred slot for the order's first delivery day;
 *   only slots that can still be served are offered and accepted.
 */

export type ServiceWindowConfig = {
  key: string;
  label: string;
  /** "HH:MM", Pakistan time. */
  startTime: string;
  endTime: string;
  slotMinutes: number;
  cutoffMinutes: number;
  isActive: boolean;
  sortOrder: number;
};

export type DeliverySlotOption = {
  /** Stored on the order, e.g. "12:00-13:00". */
  value: string;
  label: string;
  windowKey: string;
  windowLabel: string;
};

export type DeliveryOptions = {
  /** First delivery day, as 12:00 PKT on that date (same convention as before). */
  firstDeliveryDate: Date;
  isToday: boolean;
  slots: DeliverySlotOption[];
};

export const DEFAULT_SERVICE_WINDOWS: readonly ServiceWindowConfig[] = [
  { key: "lunch", label: "Lunch", startTime: "12:00", endTime: "16:00", slotMinutes: 60, cutoffMinutes: 90, isActive: true, sortOrder: 1 },
  { key: "late-lunch", label: "Late lunch", startTime: "16:00", endTime: "18:00", slotMinutes: 60, cutoffMinutes: 120, isActive: true, sortOrder: 2 },
  { key: "dinner", label: "Dinner", startTime: "18:00", endTime: "21:00", slotMinutes: 60, cutoffMinutes: 120, isActive: true, sortOrder: 3 }
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // Asia/Karachi is UTC+5 with no daylight saving.
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SLOT_RE = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(value: string): number | null {
  const match = TIME_RE.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function toHhMm(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** 750 → "12:30 PM". */
export function formatClock(minutes: number) {
  const hours24 = Math.floor(minutes / 60) % 24;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

/** "12:00-13:00" → "12:00 PM – 1:00 PM"; works for slots stored before windows existed. */
export function formatSlotLabel(value: string | null | undefined) {
  if (!value) return "Not specified";
  const match = SLOT_RE.exec(value);
  if (!match) return value;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  return `${formatClock(start)} – ${formatClock(end)}`;
}

export function isValidWindow(window: Pick<ServiceWindowConfig, "startTime" | "endTime" | "slotMinutes" | "cutoffMinutes">) {
  const start = parseTime(window.startTime);
  const end = parseTime(window.endTime);
  return (
    start !== null &&
    end !== null &&
    start < end &&
    Number.isInteger(window.slotMinutes) &&
    window.slotMinutes >= 15 &&
    window.slotMinutes <= 240 &&
    Number.isInteger(window.cutoffMinutes) &&
    window.cutoffMinutes >= 0 &&
    window.cutoffMinutes <= 1440
  );
}

/** Active, well-formed windows in display order. */
export function usableWindows(windows: readonly ServiceWindowConfig[]) {
  return windows.filter((window) => window.isActive && isValidWindow(window)).sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
}

/** Slots inside one window; the last slot is shortened to end with the window. */
export function slotsForWindow(window: ServiceWindowConfig): DeliverySlotOption[] {
  const start = parseTime(window.startTime);
  const end = parseTime(window.endTime);
  if (start === null || end === null || !isValidWindow(window)) return [];
  const slots: DeliverySlotOption[] = [];
  for (let from = start; from < end; from += window.slotMinutes) {
    const to = Math.min(from + window.slotMinutes, end);
    const value = `${toHhMm(from)}-${toHhMm(to)}`;
    slots.push({ value, label: formatSlotLabel(value), windowKey: window.key, windowLabel: window.label });
  }
  return slots;
}

/** Pakistan-time calendar parts of an instant. */
export function pktParts(now: Date) {
  const pkt = new Date(now.getTime() + PKT_OFFSET_MS);
  return {
    year: pkt.getUTCFullYear(),
    month: pkt.getUTCMonth(),
    day: pkt.getUTCDate(),
    weekday: pkt.getUTCDay(),
    minutes: pkt.getUTCHours() * 60 + pkt.getUTCMinutes()
  };
}

/** Same-day orders for this window are still accepted at `minutesNow` (PKT). */
export function isWindowOpenToday(window: ServiceWindowConfig, minutesNow: number) {
  const start = parseTime(window.startTime);
  return start !== null && minutesNow < start - window.cutoffMinutes;
}

function serviceDate(parts: ReturnType<typeof pktParts>, daysAhead: number) {
  // 12:00 in Pakistan is 07:00 UTC.
  return new Date(Date.UTC(parts.year, parts.month, parts.day + daysAhead, 7, 0, 0));
}

/**
 * Next delivery date for a menu day. Today counts while at least one window is
 * still open for same-day orders. Null for unknown day names.
 */
export function nextServiceDate(dayName: string, windows: readonly ServiceWindowConfig[], now: Date = new Date()) {
  const target = DAY_NAMES.findIndex((name) => name.toLowerCase() === dayName.trim().toLowerCase());
  if (target < 0) return null;

  const parts = pktParts(now);
  let daysAhead = (target - parts.weekday + 7) % 7;
  if (daysAhead === 0 && !usableWindows(windows).some((window) => isWindowOpenToday(window, parts.minutes))) daysAhead = 7;
  return serviceDate(parts, daysAhead);
}

/** Earliest delivery date across items; falls back to the next Monday service. */
export function earliestServiceDate(dayNames: string[], windows: readonly ServiceWindowConfig[], now: Date = new Date()) {
  const dates = dayNames.map((day) => nextServiceDate(day, windows, now)).filter((date): date is Date => date !== null);
  if (dates.length > 0) return new Date(Math.min(...dates.map((date) => date.getTime())));
  return nextServiceDate("Monday", windows, now)!;
}

/** The first delivery day for these menu days and the slots that can still be chosen for it. */
export function getDeliveryOptions(dayNames: string[], windows: readonly ServiceWindowConfig[], now: Date = new Date()): DeliveryOptions {
  const active = usableWindows(windows);
  const firstDeliveryDate = earliestServiceDate(dayNames, active, now);
  const parts = pktParts(now);
  const isToday = firstDeliveryDate.getTime() === serviceDate(parts, 0).getTime();
  const open = isToday ? active.filter((window) => isWindowOpenToday(window, parts.minutes)) : active;
  return { firstDeliveryDate, isToday, slots: open.flatMap(slotsForWindow) };
}

export function isSlotAvailable(value: string, options: DeliveryOptions) {
  return options.slots.some((slot) => slot.value === value);
}

/** Customer-facing explanation of the same-day rule, built from the windows. */
export function describeCutoffs(windows: readonly ServiceWindowConfig[]) {
  return usableWindows(windows)
    .map((window) => {
      const start = parseTime(window.startTime)!;
      return `${window.label} until ${formatClock(Math.max(0, start - window.cutoffMinutes))}`;
    })
    .join(" · ");
}
