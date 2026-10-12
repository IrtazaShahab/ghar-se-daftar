"use client";

import { useEffect, useRef, useState } from "react";
import { MAPS_MAP_ID, importMaps, importMarker, type AdvancedMarker, type GMap, type LatLngLiteral } from "@/lib/maps/google";

function markerElement(kind: "rider" | "destination") {
  const element = document.createElement("div");
  element.setAttribute("aria-hidden", "true");
  element.style.cssText =
    kind === "rider"
      ? "width:22px;height:22px;border-radius:9999px;background:#214f32;border:3px solid #fff;box-shadow:0 0 0 6px rgba(33,79,50,.2),0 4px 10px rgba(0,0,0,.25)"
      : "width:16px;height:16px;border-radius:9999px;background:#d9a85f;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25)";
  return element;
}

/**
 * Rider position (and the delivery pin, when there is one). Loaded with
 * next/dynamic only when the viewer opens the map. Calls onFail if Maps can't
 * load; the caller then shows a plain "open in Google Maps" link instead.
 */
export default function TrackingMap({ rider, destination, onFail }: { rider: LatLngLiteral; destination: LatLngLiteral | null; onFail: () => void }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<GMap | null>(null);
  const riderMarker = useRef<AdvancedMarker | null>(null);
  const fail = useRef(onFail);
  const [ready, setReady] = useState(false);
  const initial = useRef({ rider, destination });

  useEffect(() => {
    fail.current = onFail;
  }, [onFail]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([importMaps(), importMarker()])
      .then(([{ Map }, { AdvancedMarkerElement }]) => {
        if (cancelled || !element.current) return;
        const { rider: start, destination: end } = initial.current;
        const instance = new Map(element.current, { center: start, zoom: 15, mapId: MAPS_MAP_ID, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative" });
        map.current = instance;
        riderMarker.current = new AdvancedMarkerElement({ map: instance, position: start, content: markerElement("rider"), title: "Rider" });
        if (end) {
          new AdvancedMarkerElement({ map: instance, position: end, content: markerElement("destination"), title: "Delivery location" });
          instance.fitBounds(
            { north: Math.max(start.lat, end.lat), south: Math.min(start.lat, end.lat), east: Math.max(start.lng, end.lng), west: Math.min(start.lng, end.lng) },
            48
          );
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) fail.current();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // New positions move the marker without rebuilding the map.
  useEffect(() => {
    if (!riderMarker.current) return;
    riderMarker.current.position = rider;
    map.current?.panTo(rider);
  }, [rider]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-[20px] border border-border bg-card">
      <div ref={element} className="absolute inset-0" role="img" aria-label="Map showing the rider's current location" />
      {!ready ? <div className="absolute inset-0 grid place-items-center text-sm text-muted">Loading map…</div> : null}
    </div>
  );
}
