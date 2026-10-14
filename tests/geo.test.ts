import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FRESH_FOR_MS, distanceMeters, estimateEta, formatAgo, formatEta, isFresh, isValidLatLng } from "../src/lib/delivery/geo";

const gulberg = { latitude: 31.5102, longitude: 74.3441 };
const joharTown = { latitude: 31.4697, longitude: 74.2728 };

describe("location validation", () => {
  it("accepts real coordinates and rejects impossible or null-island ones", () => {
    assert.equal(isValidLatLng(gulberg), true);
    assert.equal(isValidLatLng({ latitude: 91, longitude: 74 }), false);
    assert.equal(isValidLatLng({ latitude: 31, longitude: -181 }), false);
    assert.equal(isValidLatLng({ latitude: Number.NaN, longitude: 74 }), false);
    assert.equal(isValidLatLng({ latitude: 0, longitude: 0 }), false);
    assert.equal(isValidLatLng({ latitude: "31", longitude: 74 }), false);
  });
});

describe("distance and ETA", () => {
  it("measures Lahore distances sensibly", () => {
    const meters = distanceMeters(gulberg, joharTown);
    assert.ok(meters > 7_000 && meters < 9_000, `got ${meters}`);
    assert.equal(Math.round(distanceMeters(gulberg, gulberg)), 0);
  });

  it("gives a range, and 'arriving' when very close", () => {
    const eta = estimateEta(gulberg, joharTown);
    assert.equal(eta.arriving, false);
    assert.ok(eta.minMinutes >= 20 && eta.maxMinutes <= 50, formatEta(eta));
    assert.ok(eta.maxMinutes > eta.minMinutes);
    assert.equal(formatEta(estimateEta(gulberg, { latitude: 31.5105, longitude: 74.3442 })), "Arriving now");
  });
});

describe("freshness", () => {
  const now = new Date("2026-10-06T12:00:00Z");
  it("treats points older than the threshold as stale", () => {
    assert.equal(isFresh(new Date(now.getTime() - 30_000), now), true);
    assert.equal(isFresh(new Date(now.getTime() - FRESH_FOR_MS - 1), now), false);
    assert.equal(isFresh(null, now), false);
    assert.equal(isFresh(new Date(now.getTime() + 10 * 60_000), now), false, "points from the future are not trusted");
  });

  it("formats ages", () => {
    assert.equal(formatAgo(new Date(now.getTime() - 10_000), now), "just now");
    assert.equal(formatAgo(new Date(now.getTime() - 25_000), now), "25 seconds ago");
    assert.equal(formatAgo(new Date(now.getTime() - 2 * 60_000), now), "2 minutes ago");
  });
});
