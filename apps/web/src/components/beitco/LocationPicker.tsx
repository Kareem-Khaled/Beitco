import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Loader2 } from "lucide-react";
import { hasGoogleMapsKey, loadGoogleMaps, googleEmbedSrc } from "@/lib/beitco/google-maps";

// Approximate centers for major Egyptian areas, so the map opens somewhere
// sensible before the owner drops the exact pin. Substring-matched on the area
// string. No geocoding API needed.
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

const round = (n: number) => Math.round(n * 1e6) / 1e6;

const PIN_SVG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.5 23.7 14.1 24.3.5.5 1.3.5 1.8 0C16.5 38.7 30 25.5 30 15 30 6.7 23.3 0 15 0z" fill="#1c6b62"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>',
  );

interface PickerProps {
  lat?: number;
  lng?: number;
  area?: string;
  onChange: (lat: number, lng: number) => void;
}

// Google Maps location picker. With VITE_GOOGLE_MAPS_API_KEY set it's a fully
// interactive map (drag the pin / click to place / GPS). Without a key it falls
// back to the keyless Google embed (read-only) + GPS + area-center default.
export function LocationPicker(props: PickerProps) {
  return hasGoogleMapsKey() ? <InteractivePicker {...props} /> : <EmbedPicker {...props} />;
}

function InteractivePicker({ lat, lng, area, onChange }: PickerProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastAreaRef = useRef(area);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !elRef.current) return;
        const start = lat != null && lng != null ? { lat, lng } : defaultCenter(area);
        const map = new google.maps.Map(elRef.current, {
          center: start,
          zoom: lat != null && lng != null ? 16 : 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;

        const marker = new google.maps.Marker({
          position: start,
          map,
          draggable: true,
          icon: {
            url: PIN_SVG,
            scaledSize: new google.maps.Size(30, 40),
            anchor: new google.maps.Point(15, 40),
          },
        });
        markerRef.current = marker;

        const emit = (la: number, ln: number) => onChangeRef.current(round(la), round(ln));
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (p) emit(p.lat(), p.lng());
        });
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          emit(e.latLng.lat(), e.latLng.lng());
        });

        if (lat == null || lng == null) emit(start.lat, start.lng);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat == null || lng == null || !mapRef.current || !markerRef.current) return;
    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    mapRef.current.setCenter(pos);
  }, [lat, lng]);

  // Follow the area dropdown: geocode the picked area text (covers ANY Egyptian
  // area) and pan the map + pin there; fall back to the AREA_CENTERS shortlist if
  // geocoding is unavailable.
  useEffect(() => {
    if (!ready) return;
    if (area === lastAreaRef.current) return;
    lastAreaRef.current = area;

    const applyCenter = (la: number, ln: number, zoom: number) => {
      markerRef.current?.setPosition({ lat: la, lng: ln });
      mapRef.current?.setCenter({ lat: la, lng: ln });
      mapRef.current?.setZoom(zoom);
      onChangeRef.current(round(la), round(ln));
    };

    let handled = false;
    if (area && typeof google !== "undefined" && google.maps?.Geocoder) {
      try {
        new google.maps.Geocoder().geocode(
          { address: area, region: "EG", componentRestrictions: { country: "EG" } },
          (results, status) => {
            if (status === "OK" && results && results[0]) {
              const loc = results[0].geometry.location;
              applyCenter(loc.lat(), loc.lng(), 15);
            } else {
              const c = defaultCenter(area);
              applyCenter(c.lat, c.lng, 14);
            }
          },
        );
        handled = true;
      } catch {
        handled = false;
      }
    }
    if (!handled) {
      const c = defaultCenter(area);
      applyCenter(c.lat, c.lng, 14);
    }
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
        markerRef.current?.setPosition({ lat: la, lng: ln });
        mapRef.current?.setCenter({ lat: la, lng: ln });
        mapRef.current?.setZoom(17);
        onChange(la, ln);
      },
      () => {
        setLocating(false);
        setGeoError("مقدرناش نجيب موقعك  -  اسمح للمتصفح بالوصول للموقع أو حدده يدوي على الخريطة.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (failed) return <EmbedPicker lat={lat} lng={lng} area={area} onChange={onChange} />;

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

function EmbedPicker({ lat, lng, area, onChange }: PickerProps) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  // "precise" once the owner uses GPS: then we center on the exact pin. Before
  // that, the map follows the area TEXT  -  Google geocodes it inside the iframe,
  // so changing المنطقة always moves the map, for ANY Egyptian area (not just a
  // hardcoded shortlist). Picking a new area returns to the area-text view.
  const [precise, setPrecise] = useState(lat != null && lng != null);
  const lastAreaRef = useRef(area);

  useEffect(() => {
    if (area !== lastAreaRef.current) {
      lastAreaRef.current = area;
      setPrecise(false);
    }
  }, [area]);

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
        setPrecise(true);
        onChange(round(pos.coords.latitude), round(pos.coords.longitude));
      },
      () => {
        setLocating(false);
        setGeoError("مقدرناش نجيب موقعك  -  اسمح للمتصفح بالوصول للموقع.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const src =
    precise && lat != null && lng != null
      ? googleEmbedSrc({ lat, lng, zoom: 16 })
      : googleEmbedSrc({ query: area, zoom: 13 });

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        <iframe
          title="اختيار موقع الشقة"
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-64 w-full border-0"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {precise
            ? "ده مكانك بالظبط."
            : "الخريطة بتتبع المنطقة اللي اخترتها  -  دوس «موقعي الحالي» وانت في الشقة عشان تظبط المكان بالظبط."}
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
