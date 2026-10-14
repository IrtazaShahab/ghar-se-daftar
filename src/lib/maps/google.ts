"use client";

/**
 * Loads the Google Maps JavaScript API on demand (never during page load) and
 * exposes the few pieces the app uses. The key is the browser key
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, which must be restricted in Google Cloud to
 * this site's referrers and to the Maps JavaScript API + Places API (New).
 *
 * Every caller must handle failure: no key, blocked network, invalid key
 * (gm_authFailure) or a slow load all reject, and the UI falls back to manual
 * address entry / plain links. Errors are never shown verbatim to users.
 */

export type LatLngLiteral = { lat: number; lng: number };

/* Minimal types for the parts of the Maps API used here (avoids a dependency). */
export type GMap = {
  setCenter(center: LatLngLiteral): void;
  getCenter(): { lat(): number; lng(): number } | undefined;
  setZoom(zoom: number): void;
  panTo(center: LatLngLiteral): void;
  fitBounds(bounds: LatLngBoundsLike, padding?: number): void;
  addListener(event: string, handler: () => void): { remove(): void };
};
export type LatLngBoundsLike = { north: number; south: number; east: number; west: number };
export type AdvancedMarker = { position: LatLngLiteral | null; map: GMap | null };

type PlacePrediction = {
  placeId: string;
  text: { toString(): string };
  mainText?: { toString(): string } | null;
  secondaryText?: { toString(): string } | null;
  toPlace(): Place;
};
export type Place = {
  formattedAddress?: string | null;
  displayName?: string | null;
  location?: { lat(): number; lng(): number } | null;
  addressComponents?: Array<{ longText: string | null; shortText: string | null; types: string[] }> | null;
  fetchFields(options: { fields: string[] }): Promise<unknown>;
};
type PlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: Record<string, unknown>): Promise<{ suggestions: Array<{ placePrediction: PlacePrediction | null }> }>;
  };
  AutocompleteSessionToken: new () => object;
};
type MapsLibrary = { Map: new (element: HTMLElement, options: Record<string, unknown>) => GMap };
type MarkerLibrary = { AdvancedMarkerElement: new (options: Record<string, unknown>) => AdvancedMarker };

type GoogleNamespace = { maps: { importLibrary(name: string): Promise<unknown> } };

declare global {
  interface Window {
    google?: GoogleNamespace;
    __gsdMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
/** Advanced markers need a Map ID; DEMO_MAP_ID works for development. */
export const MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || "DEMO_MAP_ID";
export const LAHORE: LatLngLiteral = { lat: 31.5204, lng: 74.3587 };

export function mapsConfigured() {
  return MAPS_API_KEY.length > 0;
}

let loading: Promise<GoogleNamespace> | null = null;

function loadScript(): Promise<GoogleNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (!MAPS_API_KEY) return Promise.reject(new Error("maps not configured"));
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google);

  return new Promise<GoogleNamespace>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("maps load timeout")), 15_000);
    const fail = (message: string) => {
      window.clearTimeout(timer);
      reject(new Error(message));
    };
    // Called by Google when the key is invalid or not allowed for this site.
    window.gm_authFailure = () => {
      authFailed = true;
      fail("maps auth failure");
    };
    window.__gsdMapsReady = () => {
      window.clearTimeout(timer);
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("maps missing after load"));
    };
    const params = new URLSearchParams({ key: MAPS_API_KEY, v: "weekly", loading: "async", callback: "__gsdMapsReady", region: "PK", language: "en" });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => fail("maps script failed");
    document.head.appendChild(script);
  });
}

let authFailed = false;

/** Resolves with the Maps namespace or rejects; retried on the next call after a failure. */
export function loadGoogleMaps() {
  if (authFailed) return Promise.reject(new Error("maps auth failure"));
  if (!loading) {
    loading = loadScript().catch((error: unknown) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export async function importPlaces() {
  const google = await loadGoogleMaps();
  return (await google.maps.importLibrary("places")) as PlacesLibrary;
}

export async function importMaps() {
  const google = await loadGoogleMaps();
  return (await google.maps.importLibrary("maps")) as MapsLibrary;
}

export async function importMarker() {
  const google = await loadGoogleMaps();
  return (await google.maps.importLibrary("marker")) as MarkerLibrary;
}

/** Area (neighbourhood) and city from a place's address components. */
export function areaAndCity(place: Place) {
  const components = place.addressComponents ?? [];
  const find = (...types: string[]) => components.find((component) => types.some((type) => component.types.includes(type)))?.longText ?? null;
  return {
    area: find("sublocality_level_1", "sublocality", "neighborhood", "sublocality_level_2") ?? find("administrative_area_level_3"),
    city: find("locality", "administrative_area_level_2")
  };
}
