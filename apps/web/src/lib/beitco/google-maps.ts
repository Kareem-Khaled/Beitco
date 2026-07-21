// Google Maps JavaScript API loader  -  SSR-safe, single-injection, promise-based.
//
// The interactive location picker (list wizard) uses the full JS API when a key
// is configured (VITE_GOOGLE_MAPS_API_KEY); without a key it falls back to the
// keyless Google embed iframe (read-only)  -  same philosophy as uploads/SMS:
// "configured -> full experience, otherwise a graceful fallback". Read-only map
// VIEWS across the app already use the keyless embed and need no key.

type GoogleNS = typeof google;

const KEY = (import.meta as unknown as { env?: Record<string, string> }).env
  ?.VITE_GOOGLE_MAPS_API_KEY;

export function hasGoogleMapsKey(): boolean {
  return typeof KEY === "string" && KEY.trim().length > 0;
}

let loadPromise: Promise<GoogleNS> | null = null;

// Loads the Maps JS API once and resolves with the `google` namespace. Rejects
// if there's no key, we're on the server, or the script fails to load.
export function loadGoogleMaps(): Promise<GoogleNS> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("google-maps: server environment"));
  }
  if (!hasGoogleMapsKey()) {
    return Promise.reject(new Error("google-maps: no VITE_GOOGLE_MAPS_API_KEY"));
  }
  // Already available (e.g. a second picker mounts).
  if (typeof google !== "undefined" && google.maps) {
    return Promise.resolve(google);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<GoogleNS>((resolve, reject) => {
    const existing = document.getElementById("google-maps-js") as HTMLScriptElement | null;
    const onReady = () => {
      if (typeof google !== "undefined" && google.maps) resolve(google);
      else reject(new Error("google-maps: loaded but namespace missing"));
    };
    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("google-maps: script error")));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.async = true;
    script.defer = true;
    // weekly channel · Arabic UI · marker library for AdvancedMarker if needed.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      KEY!,
    )}&language=ar&region=EG&libraries=marker&loading=async`;
    script.addEventListener("load", onReady);
    script.addEventListener("error", () => reject(new Error("google-maps: script error")));
    document.head.appendChild(script);
  });
  return loadPromise;
}

// Keyless read-only embed URL (used by the fallback picker + map views). Centers
// on a lat/lng pin when given, else geocodes the free-text query.
export function googleEmbedSrc(opts: {
  lat?: number;
  lng?: number;
  query?: string;
  zoom?: number;
}): string {
  const z = opts.zoom ?? (opts.lat != null ? 16 : 14);
  const q =
    opts.lat != null && opts.lng != null
      ? `${opts.lat},${opts.lng}`
      : encodeURIComponent(opts.query?.trim() || "مصر");
  return `https://maps.google.com/maps?q=${q}&z=${z}&hl=ar&output=embed`;
}
