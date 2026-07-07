import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  BedDouble,
  ShieldCheck,
  SlidersHorizontal,
  BookmarkPlus,
  BookmarkCheck,
  SearchX,
  Moon,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { BeitcoListingCard, ListingCardSkeleton } from "@/components/beitco/BeitcoListingCard";
import { EmptyState } from "@/components/beitco/EmptyState";
import { EGYPT_AREAS } from "@/lib/beitco/store";
import {
  useSearchProperties,
  useSavedSearches,
  createSavedSearch,
  alreadySavedIn,
} from "@/lib/beitco/queries";
import { useAuth } from "@/lib/beitco/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyType } from "@/lib/beitco/types";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["شقة", "أوضة", "سرير"]).optional(),
  purpose: z.enum(["rent", "sale"]).optional(),
  gender: z.enum(["male_only", "female_only"]).optional(),
  area: z.string().optional(),
  freeOnly: z.boolean().optional(),
  verifiedOnly: z.boolean().optional(),
  nightly: z.boolean().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.enum(["trust", "price_asc", "price_desc", "newest"]).optional(),
  // PROD-4: "قريب مني" geo radius. lat+lng come from the browser; radiusKm
  // defaults to 5. Server (API mode) does PostGIS; mock mode does haversine.
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  component: SearchPage,
});

const TYPES: PropertyType[] = ["شقة", "أوضة", "سرير"];
const SORT_OPTIONS = [
  { id: "trust", label: "الأكثر ثقة" },
  { id: "price_asc", label: "السعر: من الأقل" },
  { id: "price_desc", label: "السعر: من الأكتر" },
  { id: "newest", label: "الأحدث" },
] as const;

// Radix Select can't use an empty-string item value, so we use a sentinel for
// the "all areas" option and map it back to `undefined` in the URL params.
const ALL_AREAS = "__all__";

// "قريب مني" radius choices (km).
const RADIUS_OPTIONS = [2, 5, 10, 25] as const;

function SearchPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { user } = useAuth();
  const qc = useQueryClient();

  const [q, setQ] = useState(params.q ?? "");
  useEffect(() => setQ(params.q ?? ""), [params.q]);

  const submit = (next: Partial<typeof params>) => {
    navigate({ search: (prev) => ({ ...prev, ...next }) });
  };

  const result = useSearchProperties(params);
  const { hasMore, fetchMore, isFetchingMore, isLoading } = result;
  const geoActive = params.lat != null && params.lng != null;

  // Infinite scroll: auto-load the next page when the sentinel scrolls into view
  // (server mode only — mock mode returns everything in one page, hasMore=false).
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingMore) fetchMore();
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isFetchingMore, fetchMore]);

  const filtered = useMemo(() => {
    if (!result) return [];
    // API mode: the server already applied text (PROD-3) + filters + sort + geo
    // (PROD-4), so render its result as-is.
    if (result.mode === "server") return result.items;

    // Mock mode: filter/sort/rank client-side so the prototype works offline.
    let list = [...result.items];
    if (params.q) {
      const needle = params.q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.area.toLowerCase().includes(needle) ||
          p.address.toLowerCase().includes(needle),
      );
    }
    if (params.type) list = list.filter((p) => p.type === params.type);
    if (params.purpose) list = list.filter((p) => (p.listingType ?? "rent") === params.purpose);
    if (params.gender) list = list.filter((p) => p.rentToGender === params.gender);
    if (params.area) list = list.filter((p) => p.area.includes(params.area!));
    if (params.freeOnly) list = list.filter((p) => p.beds.available > 0);
    if (params.verifiedOnly) list = list.filter((p) => p.verified);
    if (params.nightly) list = list.filter((p) => (p.nightlyPrice ?? 0) > 0);
    if (params.minPrice != null) list = list.filter((p) => p.price >= params.minPrice!);
    if (params.maxPrice != null) list = list.filter((p) => p.price <= params.maxPrice!);

    // PROD-4 (mock): "قريب مني" — haversine radius filter, ordered by distance
    // (proximity overrides the sort preference, mirroring the server).
    if (params.lat != null && params.lng != null) {
      const r = params.radiusKm ?? 5;
      return list
        .map((p) => ({
          p,
          d:
            p.lat != null && p.lng != null
              ? haversineKm(params.lat!, params.lng!, p.lat, p.lng)
              : Infinity,
        }))
        .filter((x) => x.d <= r)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.p);
    }

    const sort = params.sort ?? "trust";
    list.sort((a, b) => {
      if (sort === "trust") return b.trust - a.trust;
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return list;
  }, [result, params]);

  const hasFilters =
    !!params.q ||
    !!params.type ||
    !!params.purpose ||
    !!params.gender ||
    !!params.area ||
    !!params.freeOnly ||
    !!params.verifiedOnly ||
    !!params.nightly ||
    params.minPrice != null ||
    params.maxPrice != null;

  // Saved-search state (FE-6), flag-aware via the shared query cache.
  const { data: savedSearches = [] } = useSavedSearches(user?.id);
  const alreadySaved = useMemo(
    () => (user ? alreadySavedIn(savedSearches, params) : false),
    [user, params, savedSearches],
  );

  const onSaveSearch = async () => {
    if (!user) {
      toast.error("سجّل دخولك الأول عشان تحفظ بحثك");
      navigate({ to: "/auth/login" });
      return;
    }
    if (alreadySaved) {
      toast.info("بحثك ده محفوظ عندك بالفعل");
      return;
    }
    await createSavedSearch(user.id, params);
    qc.invalidateQueries({ queryKey: ["savedSearches", user.id] });
    toast.success("اتحفظ — هنبلّغك أول ما ينزل مكان يطابقه");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">دوّر على بيتك</h1>
          <p className="text-sm text-muted-foreground">
            فلترلنا اللي عايزه وهتلاقي السرير أو الأوضة أو الشقة المناسبة.
          </p>
        </header>

        {/* Search bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit({ q: q.trim() || undefined });
          }}
          className="mb-4 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-2 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="دوّر بالمنطقة، الكومباوند، أو اسم المكان…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  submit({ q: undefined });
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="مسح"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <NearMeControl
            active={geoActive}
            radiusKm={params.radiusKm ?? 5}
            onApply={(lat, lng) => submit({ lat, lng, radiusKm: params.radiusKm ?? 5 })}
            onRadius={(radiusKm) => submit({ radiusKm })}
            onClear={() => submit({ lat: undefined, lng: undefined, radiusKm: undefined })}
          />
          <Button type="submit" className="rounded-xl">
            دوّر
          </Button>
        </form>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold">
                  <SlidersHorizontal className="h-4 w-4" />
                  فلترة
                </h3>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        search: () => ({}),
                      })
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    شيل الكل
                  </button>
                ) : null}
              </div>

              <FilterGroup label="الغرض">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: undefined, label: "الكل" },
                    { id: "rent" as const, label: "للإيجار" },
                    { id: "sale" as const, label: "للبيع" },
                  ].map((o) => {
                    const active = params.purpose === o.id;
                    return (
                      <button
                        key={o.label}
                        type="button"
                        onClick={() => submit({ purpose: o.id })}
                        className={`rounded-lg border px-2 py-1.5 text-center text-sm transition-colors ${
                          active
                            ? "border-trust bg-trust text-trust-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </FilterGroup>

              <FilterGroup label="النوع">
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => (
                    <Chip
                      key={t}
                      active={params.type === t}
                      onClick={() => submit({ type: params.type === t ? undefined : t })}
                    >
                      {t}
                    </Chip>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="السكن لمين؟">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: undefined, label: "الكل" },
                    { id: "male_only" as const, label: "شباب" },
                    { id: "female_only" as const, label: "بنات" },
                  ].map((o) => {
                    const active = params.gender === o.id;
                    return (
                      <button
                        key={o.label}
                        type="button"
                        onClick={() => submit({ gender: o.id })}
                        className={`rounded-lg border px-2 py-1.5 text-center text-sm transition-colors ${
                          active
                            ? "border-trust bg-trust text-trust-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  للسكن المشترك (سرير/أوضة).
                </p>
              </FilterGroup>

              <FilterGroup label="المنطقة">
                <Select
                  dir="rtl"
                  value={params.area ?? ALL_AREAS}
                  onValueChange={(v) => submit({ area: v === ALL_AREAS ? undefined : v })}
                >
                  <SelectTrigger className="w-full bg-surface">
                    <SelectValue placeholder="كل المناطق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_AREAS}>كل المناطق</SelectItem>
                    {EGYPT_AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterGroup>

              <FilterGroup label="السعر (ج.م/شهر)">
                <div className="flex items-center gap-2">
                  <NumberInput
                    placeholder="من"
                    value={params.minPrice ?? undefined}
                    onValueChange={(v) => submit({ minPrice: v })}
                    className="w-full bg-surface tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">—</span>
                  <NumberInput
                    placeholder="لـ"
                    value={params.maxPrice ?? undefined}
                    onValueChange={(v) => submit({ maxPrice: v })}
                    className="w-full bg-surface tabular-nums"
                  />
                </div>
              </FilterGroup>

              <FilterGroup label="غير كده">
                <div className="space-y-2 text-sm">
                  <Toggle
                    icon={<BedDouble className="h-3.5 w-3.5" />}
                    label="فيها سراير فاضية بس"
                    checked={!!params.freeOnly}
                    onChange={(v) => submit({ freeOnly: v || undefined })}
                  />
                  <Toggle
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    label="موثّق بس"
                    checked={!!params.verifiedOnly}
                    onChange={(v) => submit({ verifiedOnly: v || undefined })}
                  />
                  <Toggle
                    icon={<Moon className="h-3.5 w-3.5" />}
                    label="بتتأجّر بالليلة"
                    checked={!!params.nightly}
                    onChange={(v) => submit({ nightly: v || undefined })}
                  />
                </div>
              </FilterGroup>
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0">
            {/* Save-this-search prompt — only when filters are active */}
            {hasFilters && filtered.length > 0 ? (
              <div
                className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors ${
                  alreadySaved ? "border-trust/30 bg-trust-soft/50" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      alreadySaved ? "bg-trust text-trust-foreground" : "bg-trust-soft text-trust"
                    }`}
                  >
                    {alreadySaved ? (
                      <BookmarkCheck className="h-5 w-5" />
                    ) : (
                      <BookmarkPlus className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {alreadySaved ? "هنبلّغك بالجديد" : "عايز نبلّغك بالجديد؟"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alreadySaved
                        ? "حفظنالك اللي بتدوّر عليه — هنقولك أول ما ينزل مكان يطابقه."
                        : "احفظ اللي بتدوّر عليه، ونقولك أول ما ينزل مكان جديد يطابقه."}
                    </p>
                  </div>
                </div>
                {alreadySaved ? (
                  <Button asChild variant="ghost" size="sm" className="shrink-0 text-trust">
                    <Link to="/me">المحفوظ عندك</Link>
                  </Button>
                ) : (
                  <Button size="sm" className="shrink-0 gap-1.5" onClick={onSaveSearch}>
                    <BookmarkPlus className="h-4 w-4" />
                    احفظ بحثك
                  </Button>
                )}
              </div>
            ) : null}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite" role="status">
                {isLoading ? (
                  "بنحمّل الأماكن…"
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {filtered.length.toLocaleString("ar-EG-u-nu-latn")}
                      {hasMore ? "+" : ""}
                    </span>{" "}
                    مكان متاح
                  </>
                )}
              </p>
              {geoActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-trust-soft px-2.5 py-2 text-xs font-medium text-trust">
                  <LocateFixed className="h-3.5 w-3.5" />
                  مرتّبة بالأقرب ليك
                </span>
              ) : (
                <Select
                  dir="rtl"
                  value={params.sort ?? "trust"}
                  onValueChange={(v) => submit({ sort: v as typeof params.sort })}
                >
                  <SelectTrigger className="h-9 w-auto gap-1.5 bg-surface text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {isLoading ? (
              // Initial load: skeleton grid (avoids a false "no results" flash).
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="ما لقيناش حاجة تطابق طلبك"
                hint="جرّب تشيل شوية فلاتر أو توسّع نطاق بحثك."
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={() => navigate({ search: {} })}>
                      امسح الفلاتر
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <BeitcoListingCard key={p.id} p={p} />
                ))}
                {/* Appending the next page: skeleton cards fill in as they load */}
                {isFetchingMore
                  ? Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={`sk-${i}`} />)
                  : null}
              </div>
            )}

            {/* Infinite scroll sentinel + explicit fallback button */}
            {hasMore ? (
              <div ref={loadMoreRef} className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => fetchMore()}
                  disabled={isFetchingMore}
                  className="min-w-40"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="me-1 h-4 w-4 animate-spin" />
                      بنحمّل…
                    </>
                  ) : (
                    "شوف المزيد"
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

// "قريب مني": asks the browser for the user's location, then drives a geo
// radius search. When active it shows the radius selector + a clear button.
function NearMeControl({
  active,
  radiusKm,
  onApply,
  onRadius,
  onClear,
}: {
  active: boolean;
  radiusKm: number;
  onApply: (lat: number, lng: number) => void;
  onRadius: (km: number) => void;
  onClear: () => void;
}) {
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      toast.error("جهازك مش بيدعم تحديد المكان");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onApply(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "محتاجين إذن المكان عشان نوريك اللي قريب منك"
            : "مش قادرين نحدد مكانك دلوقتي، جرّب تاني",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (active) {
    return (
      <div className="flex items-center gap-1 rounded-xl border border-trust/40 bg-trust-soft/50 ps-3 pe-1.5 text-sm text-trust">
        <LocateFixed className="h-4 w-4 shrink-0" />
        <span className="font-medium">قريب مني</span>
        <Select dir="rtl" value={String(radiusKm)} onValueChange={(v) => onRadius(Number(v))}>
          <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-1.5 text-xs text-trust shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r.toLocaleString("ar-EG-u-nu-latn")} كم
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md p-1 hover:bg-trust/10"
          aria-label="شيل قريب مني"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="gap-1.5 rounded-xl"
      onClick={locate}
      disabled={locating}
    >
      {locating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LocateFixed className="h-4 w-4" />
      )}
      قريب مني
    </Button>
  );
}

// Great-circle distance in km — powers the mock-mode "قريب مني" radius filter
// (the API path uses PostGIS ST_DWithin server-side instead).
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
