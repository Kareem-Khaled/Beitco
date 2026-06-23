import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Loader2 } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

// Approximate centers for major Egyptian areas, so the map opens somewhere
// sensible before the owner drops the exact pin. Substring-matched on the area
// string ("المدينة · المنطقة"). No geocoding API needed.
const AREA_CENTERS: { match: string; lat: number; lng: number }[] = [
  { match: "التجمع", lat: 30.0131, lng: 31.4969 },
  { match: "القاهرة الجديدة", lat: 30.03, lng: 31.47 },
  { match: "مدينة نصر", lat: 30.0566, lng: 31.3301 },
  { match: "المعادي", lat: 29.9603, lng: 31.2569 },
  { match: "مصر الجديدة", lat: 30.0875, lng: 31.3245 },
  { match: "الزمالك", lat: 30.0614, lng: 31.2197 },
  { match: "وسط البلد", lat: 30.0444, lng: 31.2357 },
  { match: "6 أكتوبر", lat: 29.9797, lng: 30.9476 },
  { match: "أكتوبر", lat: 29.9797, lng: 30.9476 },
  { match: "الشيخ زايد", lat: 30.0411, lng: 30.9747 },
  { match: "زايد", lat: 30.0411, lng: 30.9747 },
  { match: "فيصل", lat: 29.9938, lng: 31.1716 },
  { match: "الهرم", lat: 29.9792, lng: 31.1342 },
  { match: "الدقي", lat: 30.0385, lng: 31.2118 },
  { match: "المهندسين", lat: 30.0586, lng: 31.2009 },
  { match: "الجيزة", lat: 30.0131, lng: 31.2089 },
  { match: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
  { match: "المنصورة", lat: 31.0409, lng: 31.3785 },
  { match: "طنطا", lat: 30.7865, lng: 31.0004 },
];

const CAIRO = { lat: 30.0444, lng: 31.2357 };

function defaultCenter(area?: string): { lat: number; lng: number } {
  if (area) {
    const hit = AREA_CENTERS.find((c) => area.includes(c.match));
    if (hit) return { lat: hit.lat, lng: hit.lng };
  }
  return CAIRO;
}

// A keyless, interactive pin-drop map (Leaflet + OpenStreetMap). The owner drags
// the marker, clicks to move it, or taps "موقعي الحالي" to use GPS. Renders
// client-side only (Leaflet touches the DOM), so it's SSR-safe.
export function LocationPicker({
  lat,
  lng,
  area,
  onChange,
}: {
  lat?: number;
  lng?: number;
  area?: string;
  onChange: (lat: number, lng: number) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Tracks the area we last centered on, so we only recenter on a *real* change
  // (not on mount or on unrelated re-renders).
  const lastAreaRef = useRef(area);

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Initialise the map once, on mount (client only).
  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !elRef.current) return;

      const start = lat != null && lng != null ? { lat, lng } : defaultCenter(area);

      map = L.map(elRef.current, {
        center: [start.lat, start.lng],
        zoom: lat != null && lng != null ? 16 : 13,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // CSS-based pin so we don't depend on Leaflet's bundled marker images.
      // Inline SVG in the brand's trust-green (no emoji) so it matches the design.
      const icon = L.divIcon({
        className: "",
        html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="transform:translate(-50%,-100%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.5 23.7 14.1 24.3.5.5 1.3.5 1.8 0C16.5 38.7 30 25.5 30 15 30 6.7 23.3 0 15 0z" fill="#1c6b62"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>`,
        iconSize: [0, 0],
      });

      const marker = L.marker([start.lat, start.lng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;

      const emit = (la: number, ln: number) => onChangeRef.current(round(la), round(ln));

      marker.on("dragend", () => {
        const p = marker.getLatLng();
        emit(p.lat, p.lng);
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        emit(e.latlng.lat, e.latlng.lng);
      });

      // If we opened on a default (no saved pin), seed the value so the draft
      // captures *something* even before the owner moves it.
      if (lat == null || lng == null) emit(start.lat, start.lng);

      setReady(true);
      // Leaflet sometimes needs a nudge to size correctly inside flex layouts.
      setTimeout(() => map?.invalidateSize(), 50);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync if the parent changes lat/lng externally (e.g. GPS).
  // Recenters gently at the current zoom so it doesn't fight the area-follow zoom.
  useEffect(() => {
    if (lat == null || lng == null || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng]);

  // Follow the area picked above: when the owner changes the area dropdown, pan
  // the map (and the pin) to that area's center so they fine-tune from the right
  // neighborhood. Skips the initial mount (area unchanged).
  useEffect(() => {
    if (!ready) return;
    if (area === lastAreaRef.current) return;
    lastAreaRef.current = area;
    const c = defaultCenter(area);
    markerRef.current?.setLatLng([c.lat, c.lng]);
    mapRef.current?.setView([c.lat, c.lng], 14);
    onChangeRef.current(round(c.lat), round(c.lng));
  }, [area, ready]);

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("جهازك مش بيدعم تحديد الموقع.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const la = round(pos.coords.latitude);
        const ln = round(pos.coords.longitude);
        // Zoom in close to the detected position, then persist it.
        markerRef.current?.setLatLng([la, ln]);
        mapRef.current?.setView([la, ln], 17);
        onChange(la, ln);
      },
      () => {
        setLocating(false);
        setGeoError("مقدرناش نجيب موقعك — اسمح للمتصفح بالوصول للموقع أو حدده يدوي على الخريطة.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div ref={elRef} className="h-64 w-full bg-muted" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            بنحمّل الخريطة…
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {lat != null && lng != null
            ? "حرّك الدبوس على مكان الشقة بالظبط."
            : "دوس على الخريطة عشان تحدد مكان الشقة."}
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-trust hover:text-trust disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          موقعي الحالي
        </button>
      </div>

      {geoError ? <p className="text-xs text-red-600 dark:text-red-400">{geoError}</p> : null}
    </div>
  );
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;
