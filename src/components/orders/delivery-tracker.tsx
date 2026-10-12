"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Clock, ExternalLink, MapPinned, MessageCircle, Phone, RefreshCw } from "lucide-react";
import type { TrackingView } from "@/lib/delivery/queries";
import { TRACKING_POLL_MS, formatAgo, formatEta, mapsLink } from "@/lib/delivery/geo";
import { DELIVERY_STATUS_LABELS } from "@/lib/delivery/status";
import { mapsConfigured } from "@/lib/maps/google";
import { whatsappChatUrl } from "@/lib/utils";

const TrackingMap = dynamic(() => import("@/components/maps/tracking-map"), {
  ssr: false,
  loading: () => <div className="grid h-64 place-items-center rounded-[20px] border border-border bg-card text-sm text-muted">Loading map…</div>
});

const POLLED: ReadonlySet<TrackingView["orderStatus"]> = new Set(["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"]);

/**
 * Delivery panel for the order tracking page (customer) and the admin order
 * page. Polls a small JSON endpoint while the order is on its way; when the
 * order status changes it refreshes the page so the timeline updates too.
 * A failed poll keeps the last known state and retries; tracking problems
 * never hide the basic delivery status.
 */
export function DeliveryTracker({ orderNumber, initial, admin = false }: { orderNumber: string; initial: TrackingView; admin?: boolean }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  // A server refresh hands newer data: adopt it (render-time update, no effect).
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setView(initial);
  }
  const [pollError, setPollError] = useState(false);
  // The map opens by default whenever there is a point to show; viewers can hide it.
  const [showMap, setShowMap] = useState(true);
  const [mapFailed, setMapFailed] = useState(!mapsConfigured());
  const [, tick] = useState(0);
  const status = useRef(initial.orderStatus);

  useEffect(() => {
    status.current = initial.orderStatus;
  }, [initial]);

  useEffect(() => {
    if (!POLLED.has(view.orderStatus)) return;
    let stopped = false;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/tracking/${encodeURIComponent(orderNumber)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const next = (await response.json()) as TrackingView;
        if (stopped) return;
        setView(next);
        setPollError(false);
        if (next.orderStatus !== status.current) {
          status.current = next.orderStatus;
          router.refresh();
        }
      } catch {
        if (!stopped) setPollError(true);
      }
    };
    const timer = window.setInterval(poll, TRACKING_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [orderNumber, router, view.orderStatus]);

  // Re-render "x seconds/minutes ago" labels.
  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const delivery = view.delivery;
  const outForDelivery = view.orderStatus === "OUT_FOR_DELIVERY";
  // Admins may look at the last known point even when it is stale (clearly labelled).
  const point = delivery?.live ?? (admin ? delivery?.lastKnown : null) ?? null;
  const pointLat = point?.latitude;
  const pointLng = point?.longitude;
  // Stable object per position, so the map only pans when the rider actually moved.
  const mapPoint = useMemo(() => (pointLat !== undefined && pointLng !== undefined ? { lat: pointLat, lng: pointLng } : null), [pointLat, pointLng]);
  const destLat = delivery?.destination?.latitude;
  const destLng = delivery?.destination?.longitude;
  const destination = useMemo(() => (destLat !== undefined && destLng !== undefined ? { lat: destLat, lng: destLng } : null), [destLat, destLng]);

  // Customers message the rider only while the order is on its way (the phone is only sent then anyway).
  const riderWhatsApp =
    !admin && outForDelivery && delivery?.riderPhone
      ? whatsappChatUrl(delivery.riderPhone, `Hi, I'm contacting you about my Ghar Se Daftar order ${orderNumber.toUpperCase()}.`)
      : null;

  if (!delivery) {
    if (view.orderStatus === "CANCELLED" || view.orderStatus === "DELIVERED" || view.orderStatus === "PENDING") return null;
    return (
      <p className="flex items-start gap-3 text-sm text-muted">
        <Bike className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        {admin ? "No rider assigned yet." : "A rider will be assigned when your meal is ready. You'll see their name and live location here once they're on the way."}
      </p>
    );
  }

  if (!admin && !outForDelivery && view.orderStatus !== "DELIVERED") {
    return (
      <p className="flex items-start gap-3 text-sm text-muted">
        <Bike className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        Your rider has been assigned. Live tracking will appear after pickup.
      </p>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Rider</dt>
          <dd className="mt-1 flex items-center gap-2 font-bold">
            <Bike className="size-4 text-primary" aria-hidden="true" />
            {delivery.riderName ?? "Rider"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Status</dt>
          <dd className="mt-1 font-bold">{view.orderStatus === "DELIVERED" ? "Delivered" : DELIVERY_STATUS_LABELS[delivery.status]}</dd>
        </div>
        {outForDelivery ? (
          <>
            <div>
              <dt className="text-xs text-muted">Estimated arrival</dt>
              <dd className="mt-1 flex items-center gap-2 font-bold">
                <Clock className="size-4 text-primary" aria-hidden="true" />
                {delivery.eta ? (
                  <>
                    {formatEta(delivery.eta)}
                    <span className="text-xs font-normal text-muted">estimate</span>
                  </>
                ) : (
                  <span className="font-semibold text-muted">Not available</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Last location update</dt>
              <dd className="mt-1 font-bold">
                {delivery.lastLocationAt ? formatAgo(delivery.lastLocationAt) : delivery.sharing ? "Waiting for the rider's GPS" : "Not shared"}
              </dd>
            </div>
          </>
        ) : null}
        {view.orderStatus === "DELIVERED" && delivery.deliveredAt ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Delivered</dt>
            <dd className="mt-1 font-bold">{new Date(delivery.deliveredAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" })}</dd>
          </div>
        ) : null}
        {admin && delivery.issueNote ? (
          <div className="rounded-2xl bg-danger/5 p-3 sm:col-span-2">
            <dt className="text-xs font-bold text-danger">Delivery issue</dt>
            <dd className="mt-1 break-words font-semibold">{delivery.issueNote}</dd>
          </div>
        ) : null}
      </dl>

      {outForDelivery && !delivery.live ? (
        <p role="status" className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-semibold text-secondary">
          {!delivery.sharing
            ? admin
              ? "The rider hasn't started sharing their location yet."
              : "Your rider is on the way. Live tracking will appear once they start sharing their location."
            : delivery.lastLocationAt
              ? `Live rider location is currently unavailable. Last update: ${formatAgo(delivery.lastLocationAt)}.`
              : "Waiting for the rider's GPS. The map will appear as soon as their location comes in."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {delivery.riderPhone && (admin || outForDelivery) ? (
          <a href={`tel:${delivery.riderPhone}`} className="focus-ring inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-white hover:bg-[#183f28]">
            <Phone className="size-4" aria-hidden="true" />
            Call rider
          </a>
        ) : null}
        {riderWhatsApp ? (
          <a
            href={riderWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-extrabold text-primary hover:bg-card"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp rider
          </a>
        ) : null}
        {mapPoint && (outForDelivery || admin) ? (
          mapFailed ? (
            <a
              href={mapsLink({ latitude: mapPoint.lat, longitude: mapPoint.lng })}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-extrabold text-primary hover:bg-card"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Open in Google Maps
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setShowMap((value) => !value)}
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-extrabold text-primary hover:bg-card"
              aria-expanded={showMap}
            >
              <MapPinned className="size-4" aria-hidden="true" />
              {showMap ? "Hide map" : "View on map"}
            </button>
          )
        ) : null}
      </div>

      {showMap && mapPoint && !mapFailed ? (
        <div className="grid gap-2">
          <TrackingMap rider={mapPoint} destination={destination} onFail={() => setMapFailed(true)} />
          {admin && !delivery.live && delivery.lastKnown ? <p className="text-xs font-semibold text-orange-700">Showing a stale position from {formatAgo(delivery.lastKnown.recordedAt)}.</p> : null}
        </div>
      ) : null}

      {pollError ? (
        <p role="status" className="flex items-center gap-2 text-xs text-muted">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Couldn&rsquo;t refresh live status. Retrying…
        </p>
      ) : null}
    </div>
  );
}
