"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Loader2, LocateFixed, LocateOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { riderStartSharing, riderStopSharing } from "@/app/actions/rider";
import { SEND_HEARTBEAT_MS, SEND_MIN_INTERVAL_MS, SEND_MIN_MOVE_M, distanceMeters, formatAgo } from "@/lib/delivery/geo";

type Phase = "off" | "requesting" | "sharing" | "denied" | "ended";

const noSubscription = () => () => undefined;

/**
 * Live location for ONE active delivery, only after the rider taps "Start" (the
 * server records that consent). Points are throttled (see geo.ts), only the
 * newest point is kept while offline, and watching stops as soon as the server
 * says the delivery is over, the rider taps Stop, or the page closes. If the
 * rider refuses permission the delivery still works; the customer just sees
 * status without a map.
 */
export function LocationSharing({ orderId, initiallySharing }: { orderId: string; initiallySharing: boolean }) {
  // Server render assumes support; the browser answers for real after hydration.
  const supported = useSyncExternalStore(noSubscription, () => "geolocation" in navigator, () => true);
  const [phase, setPhase] = useState<Phase>("off");
  const [message, setMessage] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const [weakSignal, setWeakSignal] = useState(false);
  const [, force] = useState(0);
  const [isPending, startTransition] = useTransition();

  const watchId = useRef<number | null>(null);
  const lastSent = useRef<{ latitude: number; longitude: number; at: number } | null>(null);
  const pending = useRef<GeolocationPosition | null>(null);
  const inFlight = useRef(false);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    pending.current = null;
  }, []);

  const send = useCallback(
    async (position: GeolocationPosition) => {
      if (inFlight.current) {
        pending.current = position; // keep only the newest point
        return;
      }
      inFlight.current = true;
      try {
        const response = await fetch("/api/rider/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null
          })
        });
        const result = (await response.json().catch(() => null)) as { ok?: boolean; stored?: boolean; weak?: boolean; stop?: boolean; error?: string } | null;
        setOffline(false);
        if (result?.ok) {
          lastSent.current = { latitude: position.coords.latitude, longitude: position.coords.longitude, at: Date.now() };
          // A too-inaccurate reading is not stored, so it must not count as "last update".
          setWeakSignal(Boolean(result.weak));
          if (!result.weak) setLastSentAt(Date.now());
        } else if (result?.stop) {
          stopWatching();
          setPhase("ended");
          setMessage("Location sharing has ended for this delivery.");
        }
      } catch {
        // Offline or the server is unreachable: keep watching and send the newest point when back.
        setOffline(true);
        pending.current = position;
      } finally {
        inFlight.current = false;
      }
    },
    [orderId, stopWatching]
  );

  const onPosition = useCallback(
    (position: GeolocationPosition) => {
      const now = Date.now();
      const previous = lastSent.current;
      if (previous) {
        const elapsed = now - previous.at;
        const moved = distanceMeters(previous, { latitude: position.coords.latitude, longitude: position.coords.longitude });
        const due = (elapsed >= SEND_MIN_INTERVAL_MS && moved >= SEND_MIN_MOVE_M) || elapsed >= SEND_HEARTBEAT_MS;
        if (!due) return;
      }
      void send(position);
    },
    [send]
  );

  const startWatching = useCallback(() => {
    if (watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      onPosition,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          stopWatching();
          setPhase("denied");
        } else {
          setMessage("Waiting for a GPS signal…");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 }
    );
    setPhase("sharing");
  }, [onPosition, stopWatching]);

  // Heartbeat while standing still (watchPosition may not fire without movement),
  // and retry the newest unsent point after a connection drop.
  useEffect(() => {
    if (phase !== "sharing") return;
    const timer = window.setInterval(() => {
      force((tick) => tick + 1);
      if (pending.current && !inFlight.current) {
        const point = pending.current;
        pending.current = null;
        void send(point);
      } else if (lastSent.current && (weakSignal || Date.now() - lastSent.current.at >= SEND_HEARTBEAT_MS)) {
        // Heartbeat, or retry soon after a reading too weak to store.
        navigator.geolocation.getCurrentPosition((position) => void send(position), () => undefined, { maximumAge: 15_000, timeout: 20_000 });
      }
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [phase, send, weakSignal]);

  // Resume after a reload when the rider already consented and permission is still granted.
  useEffect(() => {
    if (!("geolocation" in navigator) || !initiallySharing) return;
    let cancelled = false;
    const resume = async () => {
      try {
        const status = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
        if (!cancelled && status?.state === "granted") startWatching();
      } catch {
        // Permissions API unavailable: the rider taps "Resume" below.
      }
    };
    void resume();
    return () => {
      cancelled = true;
    };
  }, [initiallySharing, startWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  const start = () => {
    setMessage(null);
    setPhase("requesting");
    // Ask the browser first: the server records consent only once permission is granted.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          try {
            const result = await riderStartSharing(orderId);
            if (!result.ok) {
              setPhase("off");
              setMessage(result.error);
              return;
            }
            startWatching();
            void send(position);
          } catch {
            setPhase("off");
            setMessage("Couldn't reach the server. Check your connection and try again.");
          }
        });
      },
      (error) => {
        setPhase(error.code === error.PERMISSION_DENIED ? "denied" : "off");
        if (error.code !== error.PERMISSION_DENIED) setMessage("Couldn't get your location. Move to an open area and try again.");
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
    );
  };

  const stop = () => {
    stopWatching();
    setPhase("off");
    setLastSentAt(null);
    setWeakSignal(false);
    lastSent.current = null;
    startTransition(async () => {
      try {
        await riderStopSharing(orderId);
        setMessage("Location sharing stopped. The customer still sees the delivery status.");
      } catch {
        setMessage("Stopped on this phone. We'll stop showing your location shortly.");
      }
    });
  };

  if (!supported) {
    return <p className="text-sm text-muted">This browser can&rsquo;t share location. The customer will still see the delivery status.</p>;
  }

  return (
    <div className="grid gap-3">
      {phase === "sharing" ? (
        <>
          <p className="flex items-center gap-2 text-sm font-bold text-success">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            Sharing your live location
          </p>
          <p className="text-sm font-semibold">
            {lastSentAt ? `Last update: ${formatAgo(new Date(lastSentAt))}` : "Waiting for your first GPS fix…"}
          </p>
          <p className="text-xs text-muted">Keep this page open while you deliver. Sharing stops automatically when the order is delivered.</p>
          {weakSignal ? (
            <p className="text-xs font-semibold text-orange-700">GPS signal is weak, so the customer can&rsquo;t see you yet. Move to an open area or turn on precise location.</p>
          ) : null}
          {offline ? (
            <p className="flex items-center gap-2 text-xs font-semibold text-orange-700">
              <WifiOff className="size-3.5" aria-hidden="true" />
              Connection lost. Retrying; your latest position will be sent when you&rsquo;re back online.
            </p>
          ) : null}
          <Button type="button" variant="secondary" onClick={stop} disabled={isPending} className="h-11 gap-2">
            <LocateOff className="size-4" aria-hidden="true" />
            Stop sharing
          </Button>
        </>
      ) : phase === "ended" ? null : (
        <>
          <p className="text-sm text-muted">
            Location sharing is off. Share your live location so the customer can follow the delivery. Only they and the Ghar Se Daftar team can see it, and only until this order is delivered.
          </p>
          <Button type="button" onClick={start} disabled={phase === "requesting" || isPending} className="h-11 gap-2">
            {phase === "requesting" || isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="size-4" aria-hidden="true" />}
            {initiallySharing ? "Resume sharing location" : "Start sharing location"}
          </Button>
        </>
      )}
      {phase === "denied" ? (
        <p role="alert" className="text-xs font-semibold text-orange-700">
          Location permission is required for live tracking, but you can still complete the delivery. To share later, allow location for this site in your browser settings and tap the button again.
        </p>
      ) : null}
      {message ? <p role="status" className="text-xs font-semibold text-muted">{message}</p> : null}
    </div>
  );
}
