import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SERVICE_WINDOWS,
  describeCutoffs,
  formatSlotLabel,
  getDeliveryOptions,
  isSlotAvailable,
  nextServiceDate,
  slotsForWindow,
  usableWindows,
  type ServiceWindowConfig
} from "../src/lib/orders/service-windows";

/** A Pakistan-time wall clock instant (PKT = UTC+5). 2026-10-05 is a Monday. */
function pkt(day: string, time: string) {
  return new Date(`${day}T${time}:00+05:00`);
}

const windows = DEFAULT_SERVICE_WINDOWS;

describe("delivery slots", () => {
  it("splits windows into slots and trims the last one to the window end", () => {
    const lunch = slotsForWindow(windows[0]);
    assert.deepEqual(lunch.map((slot) => slot.value), ["12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"]);
    const odd = slotsForWindow({ ...windows[0], startTime: "12:00", endTime: "13:30", slotMinutes: 60 });
    assert.deepEqual(odd.map((slot) => slot.value), ["12:00-13:00", "13:00-13:30"]);
  });

  it("formats any stored slot, including pre-window 30-minute slots", () => {
    assert.equal(formatSlotLabel("12:30-13:00"), "12:30 PM – 1:00 PM");
    assert.equal(formatSlotLabel("18:00-19:00"), "6:00 PM – 7:00 PM");
    assert.equal(formatSlotLabel(null), "Not specified");
    assert.equal(formatSlotLabel("whenever"), "whenever");
  });

  it("ignores inactive and malformed windows", () => {
    const list: ServiceWindowConfig[] = [
      { ...windows[0], isActive: false },
      { ...windows[1], startTime: "18:00", endTime: "17:00" },
      windows[2]
    ];
    assert.deepEqual(usableWindows(list).map((window) => window.key), ["dinner"]);
  });
});

describe("same-day cutoffs", () => {
  it("keeps the original 10:30 AM lunch cutoff", () => {
    const before = getDeliveryOptions(["Monday"], windows, pkt("2026-10-05", "10:29"));
    assert.equal(before.isToday, true);
    assert.ok(isSlotAvailable("12:00-13:00", before));

    const after = getDeliveryOptions(["Monday"], windows, pkt("2026-10-05", "10:30"));
    assert.equal(after.isToday, true, "late lunch and dinner are still open today");
    assert.equal(isSlotAvailable("12:00-13:00", after), false);
    assert.ok(isSlotAvailable("16:00-17:00", after));
  });

  it("offers only dinner after the late-lunch cutoff, and nothing past the dinner cutoff", () => {
    const afternoon = getDeliveryOptions(["Monday"], windows, pkt("2026-10-05", "14:30"));
    assert.deepEqual([...new Set(afternoon.slots.map((slot) => slot.windowKey))], ["dinner"]);

    const evening = getDeliveryOptions(["Monday"], windows, pkt("2026-10-05", "16:00"));
    assert.equal(evening.isToday, false, "today's menu moves to next Monday");
    assert.equal(evening.firstDeliveryDate.toISOString(), "2026-10-12T07:00:00.000Z");
    assert.equal(evening.slots.length, 9, "every slot is open for a future day");
  });

  it("never offers a slot that has already passed", () => {
    for (const time of ["09:00", "11:00", "13:59", "15:00", "17:30", "20:00", "23:59"]) {
      const options = getDeliveryOptions(["Monday"], windows, pkt("2026-10-05", time));
      if (!options.isToday) continue;
      const minutesNow = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
      for (const slot of options.slots) {
        const [hours, minutes] = slot.value.slice(0, 5).split(":").map(Number);
        assert.ok(hours * 60 + minutes > minutesNow, `${slot.value} offered at ${time}`);
      }
    }
  });

  it("uses the earliest item day across the cart", () => {
    const options = getDeliveryOptions(["Wednesday", "Tuesday"], windows, pkt("2026-10-05", "09:00"));
    assert.equal(options.firstDeliveryDate.toISOString(), "2026-10-06T07:00:00.000Z");
    assert.equal(options.isToday, false);
  });

  it("returns null for unknown menu days", () => {
    assert.equal(nextServiceDate("Someday", windows, pkt("2026-10-05", "09:00")), null);
  });

  it("describes cutoffs for customers", () => {
    assert.equal(describeCutoffs(windows), "Lunch until 10:30 AM · Late lunch until 2:00 PM · Dinner until 4:00 PM");
  });
});
