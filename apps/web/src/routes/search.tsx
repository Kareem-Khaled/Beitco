import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, X, BedDouble, ShieldCheck, SlidersHorizontal, BookmarkPlus, BookmarkCheck, SearchX, Moon } from "lucide-react";
import { z } from "zod";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { BeitcoListingCard } from "@/components/beitco/BeitcoListingCard";
import { EmptyState } from "@/components/beitco/EmptyState";
import { getPublishedProperties, EGYPT_AREAS, saveSearch, hasSavedSearch } from "@/lib/beitco/store";
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

function SearchPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { user } = useAuth();

  const [q, setQ] = useState(params.q ?? "");
  useEffect(() => setQ(params.q ?? ""), [params.q]);

  const submit = (next: Partial<typeof params>) => {
    navigate({ search: (prev) => ({ ...prev, ...next }) });
  };

  const all = useMemo(() => getPublishedProperties(), []);

  const filtered = useMemo(() => {
    let list = [...all];
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
    if (params.purpose)
      list = list.filter((p) => (p.listingType ?? "rent") === params.purpose);
    if (params.gender) list = list.filter((p) => p.rentToGender === params.gender);
    if (params.area) list = list.filter((p) => p.area.includes(params.area!));
    if (params.freeOnly) list = list.filter((p) => p.beds.available > 0);
    if (params.verifiedOnly) list = list.filter((p) => p.verified);
    if (params.nightly) list = list.filter((p) => (p.nightlyPrice ?? 0) > 0);
    if (params.minPrice != null) list = list.filter((p) => p.price >= params.minPrice!);
    if (params.maxPrice != null) list = list.filter((p) => p.price <= params.maxPrice!);

    const sort = params.sort ?? "trust";
    list.sort((a, b) => {
      if (sort === "trust") return b.trust - a.trust;
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return list;
  }, [all, params]);

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

  // Saved-search state (FE-6). `savedTick` forces a re-check after saving.
  const [savedTick, setSavedTick] = useState(0);
  const alreadySaved = useMemo(
    () => (user ? hasSavedSearch(user.id, params) : false),
    [user, params, savedTick],
  );

  const onSaveSearch = () => {
    if (!user) {
      toast.error("ادخل حسابك الأول عشان تحفظ بحثك");
      navigate({ to: "/auth/login" });
      return;
    }
    if (alreadySaved) {
      toast.info("بحثك ده محفوظ عندك بالفعل");
      return;
    }
    saveSearch(user.id, params);
    setSavedTick((t) => t + 1);
    toast.success("اتحفظ — هنبلّغك أول ما ينزل مكان يطابقه");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">دوّر على بيتك</h1>
          <p className="text-sm text-muted-foreground">
            فلترلنا اللي عايزه ولاقي السرير أو الأوضة أو الشقة المناسبة.
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
                    label="فيها أسرّة فاضية بس"
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
                  alreadySaved
                    ? "border-trust/30 bg-trust-soft/50"
                    : "border-border bg-card"
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
                <span className="font-medium text-foreground">
                  {filtered.length.toLocaleString("ar-EG-u-nu-latn")}
                </span>{" "}
                مكان متاح
              </p>
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
            </div>

            {filtered.length === 0 ? (
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
              </div>
            )}
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
