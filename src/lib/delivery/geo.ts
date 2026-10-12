/**
 * Live-location rules shared by the rider app, the server and tracking views.
 *
 * Update cadence (documented in docs/DELIVERY_AND_RIDERS.md):
 * - The rider's browser watches GPS but sends a point only when it has moved
 *   SEND_MIN_MOVE_M since the last sent point and SEND_MIN_INTERVAL_MS has
 *   passed, or as a heartbeat every SEND_HEARTBEAT_MS while standing still.
 *   That is at most one write every 15 s, typically 2–4 per minute.
 * - The server ignores points closer together than SERVER_MIN_INTERVAL_MS, so
 *   a buggy or malicious client can't write every second.
 * - Only the latest point is stored; it is cleared when the delivery ends.
 * - A point older than FRESH_FOR_MS is "stale": tracking views stop showing a
 *   map and say live location is unavailable, with the time of the last update.
 */

export const SEND_MIN_INTERVAL_MS = 15_000;
export const SEND_MIN_MOVE_M = 30;
export const SEND_HEARTBEAT_MS = 60_000;
export const SERVER_MIN_INTERVAL_MS = 8_000;
export const FRESH_FOR_MS = 2 * 60_000;
/** Readings worse than this are noise (e.g. IP-based location) and are not stored. */
export const MAX_ACCURACY_M = 1_000;
/** Customer tracking polls this often while the order is out for delivery. */
export const TRACKING_POLL_MS = 15_000;

export type LatLng = { latitude: number; longitude: number };

export function isValidLatLng(value: { latitude: unknown; longitude: unknown }): value is LatLng {
  return (
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180 &&
    // (0, 0) is what broken GPS stacks report; it is in the ocean, never a delivery.
    !(value.latitude === 0 && value.longitude === 0)
  );
}

/** Great-circle distance in metres. */
export function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isFresh(recordedAt: Date | string | null | undefined, now: Date = new Date()) {
  if (!recordedAt) return false;
  const time = new Date(recordedAt).getTime();
  return Number.isFinite(time) && now.getTime() - time <= FRESH_FOR_MS && now.getTime() - time >= -60_000;
}

/** City motorbike estimate: straight-line distance × road factor at an average urban speed. */
const ROAD_FACTOR = 1.35;
const AVG_SPEED_KMH = 20;

export type Eta = { minMinutes: number; maxMinutes: number; arriving: boolean };

/**
 * A rough arrival range from the rider's last fresh point to the delivery pin.
 * It is an estimate without live traffic, shown as a range and labelled as such.
 */
export function estimateEta(from: LatLng, to: LatLng): Eta {
  const meters = distanceMeters(from, to);
  if (meters < 150) return { minMinutes: 0, maxMinutes: 2, arriving: true };
  const minutes = ((meters * ROAD_FACTOR) / 1000 / AVG_SPEED_KMH) * 60;
  const minMinutes = Math.max(1, Math.floor(minutes * 0.85));
  const maxMinutes = Math.max(minMinutes + 2, Math.ceil(minutes * 1.3) + 2);
  return { minMinutes, maxMinutes, arriving: false };
}

export function formatEta(eta: Eta) {
  return eta.arriving ? "Arriving now" : `${eta.minMinutes}–${eta.maxMinutes} min`;
}

/** "just now", "25 seconds ago", "2 minutes ago", "1 hour ago". */
export function formatAgo(value: Date | string, now: Date = new Date()) {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(value).getTime()) / 1000));
  if (seconds < 15) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

/** Google Maps link for a point; only rendered for people allowed to see it. */
export function mapsLink(point: LatLng) {
  return `https://www.google.com/maps/search/?api=1&query=${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
}

/** Turn-by-turn directions link to a destination (rider app). */
export function directionsLink(point: LatLng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}&travelmode=driving`;
}

/** Directions to a typed address when there is no pin. */
export function addressDirectionsLink(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}
