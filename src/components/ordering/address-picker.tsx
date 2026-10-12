"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { LAHORE, areaAndCity, importPlaces, mapsConfigured, type LatLngLiteral, type Place } from "@/lib/maps/google";
import { cn } from "@/lib/utils";

const PinMap = dynamic(() => import("@/components/maps/pin-map"), {
  ssr: false,
  loading: () => <div className="grid h-56 place-items-center rounded-[20px] border border-border bg-card text-sm text-muted sm:h-64">Loading map…</div>
});

type Suggestion = { id: string; main: string; secondary: string; toPlace: () => Place };

export type PickedPlace = { address: string; area: string | null; city: string | null; latitude: number; longitude: number };

/**
 * Google Places search + map pin for checkout. Entirely optional: when Maps is
 * not configured or fails to load, it says so briefly and the customer types
 * the address in the fields below (which always work). Choosing a place fills
 * those fields; the customer can still edit the text, and the pin is kept.
 */
export function AddressPicker({
  pin,
  disabled,
  onPick,
  onPinMove,
  onClearPin
}: {
  pin: LatLngLiteral | null;
  disabled?: boolean;
  onPick: (place: PickedPlace) => void;
  onPinMove: (point: LatLngLiteral) => void;
  onClearPin: () => void;
}) {
  const enabled = mapsConfigured();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(!enabled);
  const [showMap, setShowMap] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const session = useRef<object | null>(null);
  const requestId = useRef(0);

  // Results for a query that has since been shortened are hidden, not shown stale.
  const visible = query.trim().length >= 3 ? suggestions : [];

  const fail = useCallback(() => {
    setUnavailable(true);
    setOpen(false);
    setShowMap(false);
    setBusy(false);
  }, []);

  // Debounced suggestions; the Maps script is only fetched once the customer types.
  useEffect(() => {
    if (unavailable || query.trim().length < 3) return;
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const places = await importPlaces();
        session.current ??= new places.AutocompleteSessionToken();
        const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query.trim(),
          sessionToken: session.current,
          includedRegionCodes: ["pk"],
          locationBias: { center: LAHORE, radius: 40_000 },
          language: "en"
        });
        if (id !== requestId.current) return;
        setSuggestions(
          results
            .map((result) => result.placePrediction)
            .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction))
            .slice(0, 5)
            .map((prediction) => ({
              id: prediction.placeId,
              main: prediction.mainText?.toString() ?? prediction.text.toString(),
              secondary: prediction.secondaryText?.toString() ?? "",
              toPlace: () => prediction.toPlace()
            }))
        );
        setHighlight(-1);
        setOpen(true);
      } catch {
        if (id === requestId.current) fail();
      } finally {
        if (id === requestId.current) setBusy(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, unavailable, fail]);

  const choose = async (suggestion: Suggestion) => {
    setOpen(false);
    setBusy(true);
    setNotice(null);
    try {
      const place = suggestion.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location", "addressComponents", "displayName"] });
      session.current = null; // a selection ends the billing session
      const location = place.location;
      if (!location) throw new Error("no location");
      const { area, city } = areaAndCity(place);
      onPick({
        address: place.formattedAddress ?? suggestion.main,
        area,
        city,
        latitude: Number(location.lat().toFixed(6)),
        longitude: Number(location.lng().toFixed(6))
      });
      setQuery("");
      setShowMap(true);
      setNotice("Address filled in below. Add your building, floor or office number, and drag the map if the pin is off.");
    } catch {
      setNotice("We couldn't load that place. Pick another result or type your address below.");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || visible.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % visible.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index <= 0 ? visible.length - 1 : index - 1));
    } else if (event.key === "Enter" && highlight >= 0) {
      event.preventDefault();
      void choose(visible[highlight]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  if (unavailable) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-primary/5 px-4 py-3 text-xs text-muted">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        {enabled ? "Address search is unavailable right now. Type your address below; that works just as well." : "Type your delivery address below."}
      </p>
    );
  }

  return (
    <div className="grid min-w-0 gap-3">
      <div className="relative">
        <label htmlFor={`${listId}-search`} className="text-sm font-semibold">Search your address</label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id={`${listId}-search`}
            type="text"
            role="combobox"
            aria-expanded={open && visible.length > 0}
            aria-controls={`${listId}-list`}
            aria-autocomplete="list"
            aria-activedescendant={highlight >= 0 ? `${listId}-opt-${highlight}` : undefined}
            autoComplete="off"
            disabled={disabled}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onFocus={() => visible.length > 0 && setOpen(true)}
            placeholder="Office building, street or area"
            className="focus-ring h-[52px] w-full min-w-0 rounded-[18px] border border-border bg-white/85 pl-11 pr-10 text-sm transition placeholder:text-muted hover:border-primary/30 focus:border-primary"
          />
          {busy ? <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" aria-label="Searching" /> : null}
        </div>
        {open && visible.length > 0 ? (
          <ul id={`${listId}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-[18px] border border-border bg-white p-1 shadow-xl shadow-primary/10">
            {visible.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={index === highlight}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void choose(suggestion)}
                className={cn("cursor-pointer rounded-2xl px-3 py-2.5 text-sm", index === highlight ? "bg-primary/10" : "hover:bg-card")}
              >
                <p className="break-words font-semibold">{suggestion.main}</p>
                {suggestion.secondary ? <p className="break-words text-xs text-muted">{suggestion.secondary}</p> : null}
              </li>
            ))}
            <li className="px-3 pb-1 pt-2 text-right text-[10px] text-muted" aria-hidden="true">Powered by Google</li>
          </ul>
        ) : null}
      </div>

      {notice ? <p role="status" className="text-xs font-semibold text-primary">{notice}</p> : null}

      {pin ? (
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 font-bold text-success">
              <LocateFixed className="size-3.5" aria-hidden="true" />
              Location pinned
            </span>
            <button type="button" onClick={() => setShowMap((value) => !value)} className="focus-ring rounded-full px-2 py-1 font-bold text-primary underline-offset-2 hover:underline">
              {showMap ? "Hide map" : "Check pin on map"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMap(false);
                setNotice(null);
                onClearPin();
              }}
              className="focus-ring inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold text-muted hover:text-danger"
            >
              <X className="size-3.5" aria-hidden="true" />
              Remove pin
            </button>
          </div>
          {showMap ? <PinMap center={pin} onMove={onPinMove} onFail={fail} /> : null}
        </div>
      ) : null}
    </div>
  );
}
