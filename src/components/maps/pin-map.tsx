"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { MAPS_MAP_ID, importMaps, type GMap, type LatLngLiteral } from "@/lib/maps/google";

/**
 * Map preview with a fixed pin in the middle: the customer drags the map to put
 * the pin on their door. Loaded with next/dynamic only when shown, so checkout
 * never waits for Google Maps. Calls onFail if the map can't load.
 */
export default function PinMap({ center, onMove, onFail }: { center: LatLngLiteral; onMove: (point: LatLngLiteral) => void; onFail: () => void }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<GMap | null>(null);
  const last = useRef<LatLngLiteral>(center);
  const handlers = useRef({ onMove, onFail });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    handlers.current = { onMove, onFail };
  }, [onMove, onFail]);

  useEffect(() => {
    let cancelled = false;
    let listener: { remove(): void } | null = null;
    importMaps()
      .then(({ Map }) => {
        if (cancelled || !element.current) return;
        const instance = new Map(element.current, {
          center: last.current,
          zoom: 17,
          mapId: MAPS_MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative"
        });
        map.current = instance;
        listener = instance.addListener("idle", () => {
          const current = instance.getCenter();
          if (!current) return;
          const point = { lat: Number(current.lat().toFixed(6)), lng: Number(current.lng().toFixed(6)) };
          if (Math.abs(point.lat - last.current.lat) < 0.000005 && Math.abs(point.lng - last.current.lng) < 0.000005) return;
          last.current = point;
          handlers.current.onMove(point);
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) handlers.current.onFail();
      });
    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  // A new search result moves the map (without reporting it back as a drag).
  useEffect(() => {
    if (!map.current) return;
    if (Math.abs(center.lat - last.current.lat) < 0.000005 && Math.abs(center.lng - last.current.lng) < 0.000005) return;
    last.current = center;
    map.current.setCenter(center);
  }, [center]);

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-[20px] border border-border bg-card sm:h-64">
      <div ref={element} className="absolute inset-0" aria-label="Map: drag to place the pin on your delivery location" role="application" />
      <MapPin aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-full fill-primary/90 text-white drop-shadow-lg" />
      {!ready ? <div className="absolute inset-0 grid place-items-center text-sm text-muted">Loading map…</div> : null}
    </div>
  );
}
