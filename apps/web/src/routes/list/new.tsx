import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Home,
  BedDouble,
  DoorOpen,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ImagePlus,
  MapPin,
  ShieldCheck,
  Plus,
  Trash2,
  Sofa,
  TrainFront,
  Sparkles,
  Search,
  Tag,
  KeyRound,
  Star,
  GraduationCap,
  Bus,
  ShoppingBag,
  Stethoscope,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/beitco/LocationPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/beitco/auth";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  propertyToDraft,
  makeRoom,
  makeBed,
  makeNearby,
  makeCustomSpec,
  STEPS,
  type ListingDraft,
  type StepId,
} from "@/lib/beitco/listing-draft";
import {
  getProperty,
  getInitialListingStatus,
  summarizeListing,
  EGYPT_LOCATIONS,
  formatArea,
  parseArea,
  ALL_AMENITIES,
  GENERAL_AMENITIES,
  APPLIANCE_AMENITIES,
  UNIT_TYPES,
  ROOM_FEATURES,
  NEARBY_TYPES,
  CAIRO_METRO_LINES,
} from "@/lib/beitco/store";
import { USE_API, apiGetProperty } from "@/lib/beitco/api";
import { saveListing } from "@/lib/beitco/queries";
import { uploadImage } from "@/lib/beitco/uploads";
import type {
  Property,
  RentalMode,
  RentalGenderPolicy,
  ListingType,
  Room,
  Bed,
  BedStatus,
  NearbyPlace,
  NearbyType,
  CustomSpec,
} from "@/lib/beitco/types";

export const Route = createFileRoute("/list/new")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: ListNewPage,
});

const LAST_STEP = STEPS.length as StepId;

function ListNewPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { edit: editId } = Route.useSearch();
  const isEdit = !!editId;
  const [step, setStep] = useState<StepId>(1);
  const [draft, setDraft] = useState<ListingDraft>({});
  const [hydrated, setHydrated] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // The existing listing when editing — fetched once (flag-aware) and reused by
  // the ownership guard + publish (instead of re-reading the store each time).
  const [existingProp, setExistingProp] = useState<Property | undefined>(undefined);
  const [publishing, setPublishing] = useState(false);

  // Hydrate: edit mode prefills from the existing property; create mode loads the saved draft.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isEdit && editId) {
        const existing = USE_API ? await apiGetProperty(editId) : getProperty(editId);
        if (cancelled) return;
        if (existing) {
          setExistingProp(existing);
          setDraft(propertyToDraft(existing));
        } else {
          setNotFound(true);
        }
      } else {
        // Seed sensible defaults so the values shown in the wizard are the ones
        // actually stored (a saved draft overrides them). Without this, the
        // displayed "2 أوض / 1 حمام" wasn't a real value and blocked step 2.
        setDraft({ listingType: "rent", bedrooms: 2, bathrooms: 1, ...loadDraft() });
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, editId]);

  // Only persist the new-listing draft; don't clobber it while editing.
  useEffect(() => {
    if (hydrated && !isEdit) saveDraft(draft);
  }, [draft, hydrated, isEdit]);

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth/login" });
  }, [user, isLoading, navigate]);

  // Ownership guard for edit mode.
  useEffect(() => {
    if (!hydrated || !isEdit || !user) return;
    if (existingProp && existingProp.ownerId !== user.id) {
      navigate({ to: "/dashboard/listings" });
    }
  }, [hydrated, isEdit, existingProp, user, navigate]);

  const update = (patch: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const canProceed = useMemo(() => validateStep(step, draft), [step, draft]);

  const next = () => setStep((s) => Math.min(LAST_STEP, s + 1) as StepId);
  const back = () => setStep((s) => Math.max(1, s - 1) as StepId);

  const handlePublish = async () => {
    if (!user || publishing) return;
    const existing = existingProp;
    const property = draftToProperty(draft, user.id, user.name, existing);

    // Moderation gate (MOD-1): verified owners auto-publish; unverified owners'
    // listings enter the review queue. Editing a live listing keeps it live;
    // (re)publishing a new/draft/rejected one runs through the gate. In API mode
    // the server is authoritative (returns the decided status); the mock sets it
    // here so the localStorage path behaves identically.
    const wasLive = existing?.status === "published" || existing?.status === "paused";
    if (!wasLive) {
      property.status = getInitialListingStatus(user);
    }

    setPublishing(true);
    let saved: Property;
    try {
      saved = await saveListing(property, { isEdit, editId });
    } catch (err) {
      setPublishing(false);
      toast.error(err instanceof Error ? err.message : "مقدرناش نحفظ الإعلان دلوقتي");
      return;
    }
    if (!isEdit) clearDraft();

    // Refresh the caches the destination pages read, so the listing's new state
    // (e.g. rejected -> pending_approval after a resubmit) shows immediately
    // instead of stale until a manual refresh. Covers the owner grid, the public
    // detail loader's cached copy, and the admin moderation queue/count.
    if (user) qc.invalidateQueries({ queryKey: ["ownerProperties", user.id] });
    qc.invalidateQueries({ queryKey: ["property", saved.id] });
    qc.invalidateQueries({ queryKey: ["pendingListings"] });
    qc.invalidateQueries({ queryKey: ["moderationCount"] });
    if (user) qc.invalidateQueries({ queryKey: ["notificationsUnread", user.id] });

    const pending = saved.status === "pending_approval";
    toast.success(
      isEdit
        ? "اتحفظت التعديلات"
        : pending
          ? "بعتنا إعلانك للمراجعة — هيظهر للناس بعد ما نوافق عليه (عادة خلال ساعات)."
          : "اتنشر الإعلان",
    );
    // Replace the wizard in history so the browser Back button skips the form
    // (otherwise saving an edit and pressing Back returns to the edit page).
    if (pending) {
      navigate({ to: "/dashboard/listings", replace: true });
    } else {
      navigate({ to: "/property/$id", params: { id: saved.id }, replace: true });
    }
  };

  if (!hydrated || isLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return null;

  if (notFound) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center"
      >
        <p className="text-sm text-muted-foreground">الإعلان اللي بتحاول تعدّله مش موجود.</p>
        <Button onClick={() => navigate({ to: "/dashboard/listings" })}>ارجع لشققك</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="font-display text-2xl font-bold text-trust">
            بيتكو
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {isEdit ? "تعديل · " : ""}خطوة {step} من {STEPS.length}
            </span>
            <Link
              to={isEdit ? "/dashboard/listings" : "/"}
              className="text-muted-foreground hover:text-foreground"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 px-4 pb-3">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s.id <= step ? "bg-trust" : "bg-border"
              }`}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-2 text-sm font-medium text-trust">{STEPS[step - 1].label}</div>
        <StepContent step={step} draft={draft} update={update} />

        <div className="mt-10 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={back} className="gap-1">
              <ArrowRight className="h-4 w-4" />
              السابق
            </Button>
          ) : (
            <span />
          )}
          {step < LAST_STEP ? (
            <Button onClick={next} disabled={!canProceed} size="lg" className="gap-1 rounded-xl">
              كمّل
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={publishing} size="lg" className="rounded-xl">
              {publishing ? "بنحفظ…" : isEdit ? "احفظ التعديلات" : "انشر الإعلان"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

// ───────────────────────── Step router ─────────────────────────

function StepContent({
  step,
  draft,
  update,
}: {
  step: StepId;
  draft: ListingDraft;
  update: (patch: Partial<ListingDraft>) => void;
}) {
  switch (step) {
    case 1:
      return <StepLocation draft={draft} update={update} />;
    case 2:
      return <StepSpecs draft={draft} update={update} />;
    case 3:
      return <StepRentalMode draft={draft} update={update} />;
    case 4:
      return <StepRoomsPricing draft={draft} update={update} />;
    case 5:
      return <StepAmenities draft={draft} update={update} />;
    case 6:
      return <StepPhotos draft={draft} update={update} />;
    case 7:
      return <StepDescription draft={draft} update={update} />;
    case 8:
      return <StepReview draft={draft} />;
  }
}

// ───────────────────────── Step 1: Location ─────────────────────────

function StepLocation({ draft, update }: StepProps) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">الشقة فين؟</h1>
      <p className="mt-2 text-sm text-muted-foreground">المنطقة بتساعد المستأجرين يلاقوا مكانك.</p>

      <div className="mt-8 flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium">المنطقة</label>
          <AreaPicker value={draft.area} onChange={(area) => update({ area })} />
        </div>

        <div>
          <label htmlFor="address" className="mb-2 block text-sm font-medium">
            العنوان بالتفصيل
          </label>
          <Input
            id="address"
            placeholder="مثال: شارع التسعين الجنوبي، عمارة 4، الدور التالت"
            value={draft.address ?? ""}
            onChange={(e) => update({ address: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            مش هنعرض العنوان الكامل قبل ما المستأجر يبعتلك ويتأكد منك.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            حدّد المكان على الخريطة
            <span className="ms-1 text-xs font-normal text-muted-foreground">
              (اختياري بس بيساعد جدًا)
            </span>
          </label>
          <LocationPicker
            lat={draft.lat}
            lng={draft.lng}
            area={draft.area}
            onChange={(lat, lng) => update({ lat, lng })}
          />
        </div>
      </div>
    </div>
  );
}

// Searchable city → district picker. Egypt has many areas, so a flat grid
// doesn't scale; this lets the owner search a city then pick (or type) a
// district. Output stays the canonical "المدينة · المنطقة" string.
function AreaPicker({ value, onChange }: { value?: string; onChange: (area: string) => void }) {
  const { city, district } = useMemo(() => parseArea(value), [value]);
  const [editingCity, setEditingCity] = useState(!city);
  const [cityQuery, setCityQuery] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");
  const [customDistrict, setCustomDistrict] = useState("");
  // Free-text district (for cities with no preset list). Kept in local state so
  // typing — spaces included — isn't clobbered by the trimmed area round-trip.
  const [freeDistrict, setFreeDistrict] = useState(district);
  // Reset the free-text field whenever the chosen city changes.
  useEffect(() => {
    setFreeDistrict(parseArea(value).district);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const selected = EGYPT_LOCATIONS.find((l) => l.city === city);
  const districts = selected?.districts ?? [];

  const filteredCities = cityQuery.trim()
    ? EGYPT_LOCATIONS.filter((l) => l.city.includes(cityQuery.trim()))
    : EGYPT_LOCATIONS;
  const filteredDistricts = districtQuery.trim()
    ? districts.filter((d) => d.includes(districtQuery.trim()))
    : districts;

  const chooseCity = (c: string) => {
    onChange(c);
    setEditingCity(false);
    setDistrictQuery("");
    setCustomDistrict("");
  };
  const addCustomDistrict = () => {
    const v = customDistrict.trim();
    if (!v) return;
    onChange(formatArea(city, v));
    setCustomDistrict("");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Chosen area summary */}
      {city && !editingCity ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-trust bg-trust-soft px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-trust" />
            {value}
          </span>
          <button
            type="button"
            onClick={() => setEditingCity(true)}
            className="text-xs font-medium text-trust hover:underline"
          >
            غيّر المدينة
          </button>
        </div>
      ) : null}

      {/* City search + list */}
      {editingCity ? (
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="دوّر على المدينة (القاهرة، الجيزة، إسكندرية…)"
              className="pe-9"
            />
          </div>
          <div className="mt-2 grid max-h-56 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
            {filteredCities.map((l) => (
              <button
                key={l.city}
                type="button"
                onClick={() => chooseCity(l.city)}
                className={`rounded-lg border p-2.5 text-start text-sm transition-all ${
                  city === l.city
                    ? "border-trust bg-trust-soft text-foreground"
                    : "border-border bg-background hover:border-foreground/20"
                }`}
              >
                {l.city}
                {l.districts.length > 0 ? (
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {l.districts.length.toLocaleString("ar-EG-u-nu-latn")} منطقة
                  </span>
                ) : null}
              </button>
            ))}
            {filteredCities.length === 0 ? (
              <p className="col-span-full p-2 text-xs text-muted-foreground">
                مفيش مدينة بالاسم ده.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* District picker for the chosen city */}
      {city && !editingCity ? (
        districts.length > 0 ? (
          <div className="rounded-xl border border-border bg-surface p-3">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              المنطقة جوّه {city}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={districtQuery}
                onChange={(e) => setDistrictQuery(e.target.value)}
                placeholder="دوّر على المنطقة…"
                className="pe-9"
              />
            </div>
            <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-auto">
              {filteredDistricts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange(formatArea(city, d))}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    district === d
                      ? "border-trust bg-trust text-trust-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={customDistrict}
                onChange={(e) => setCustomDistrict(e.target.value)}
                placeholder="منطقتك مش في القايمة؟ اكتبها"
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomDistrict();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomDistrict}>
                <Plus className="me-1 h-4 w-4" />
                ضيف
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-3">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              المنطقة جوّه {city} (اختياري)
            </label>
            <Input
              value={freeDistrict}
              onChange={(e) => {
                setFreeDistrict(e.target.value);
                onChange(formatArea(city, e.target.value));
              }}
              placeholder="مثلاً: اسم الحي أو الشارع"
              className="text-sm"
            />
          </div>
        )
      ) : null}
    </div>
  );
}

// ───────────────────────── Step 2: Apartment specs ─────────────────────────

function StepSpecs({ draft, update }: StepProps) {
  const bedrooms = draft.bedrooms ?? 2;
  const bathrooms = draft.bathrooms ?? 1;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">مواصفات الشقة</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        المعلومات دي بتظهر للمستأجر وبتساعده ياخد قراره.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium">نوع الوحدة</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {UNIT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update({ unitType: t })}
                className={`rounded-lg border p-3 text-center text-sm transition-all ${
                  draft.unitType === t
                    ? "border-trust bg-trust-soft text-foreground"
                    : "border-border bg-surface hover:border-foreground/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <NumberStepper
          label="عدد الأوض"
          value={bedrooms}
          min={1}
          max={10}
          onChange={(v) => update({ bedrooms: v })}
        />
        <NumberStepper
          label="عدد الحمامات"
          value={bathrooms}
          min={1}
          max={6}
          onChange={(v) => update({ bathrooms: v })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              الدور <span className="text-red-500">*</span>
            </label>
            <NumberInput
              placeholder="مثال: 3 (أرضي = 0)"
              value={draft.floor}
              onValueChange={(v) => update({ floor: v })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              المساحة (م²) <span className="text-red-500">*</span>
            </label>
            <NumberInput
              placeholder="مثال: 120"
              value={draft.sizeM2}
              onValueChange={(v) => update({ sizeM2: v })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Sofa className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">الشقة مفروشة؟</span>
          </div>
          <div className="flex gap-2">
            <TogglePill
              active={draft.furnished === true}
              onClick={() => update({ furnished: true })}
            >
              مفروشة
            </TogglePill>
            <TogglePill
              active={draft.furnished === false}
              onClick={() => update({ furnished: false })}
            >
              مش مفروشة
            </TogglePill>
          </div>
        </div>

        <NearbySection draft={draft} update={update} />
        <CustomSpecsSection draft={draft} update={update} />
      </div>
    </div>
  );
}

// ── Nearby / transit (قريب من المترو، الجامعة...) ──

// A fitting example per nearby type so the placeholder guides the owner.
const NEARBY_PLACEHOLDERS: Record<NearbyType, string> = {
  مترو: "اختار الخط الأول",
  جامعة: "مثلاً: جامعة القاهرة",
  مواصلات: "مثلاً: موقف عبد المنعم رياض",
  مول: "مثلاً: سيتي ستارز",
  مستشفى: "مثلاً: مستشفى الدمرداش",
  "سوبر ماركت": "مثلاً: كارفور",
  "حاجة تانية": "مثلاً: نادي الجزيرة",
};

// On-theme lucide icon per nearby type (no emojis).
const NEARBY_ICONS: Record<NearbyType, React.ComponentType<{ className?: string }>> = {
  مترو: TrainFront,
  جامعة: GraduationCap,
  مواصلات: Bus,
  مول: ShoppingBag,
  مستشفى: Stethoscope,
  "سوبر ماركت": Store,
  "حاجة تانية": MapPin,
};

function NearbySection({ draft, update }: StepProps) {
  const items = draft.nearby ?? [];

  const set = (id: string, patch: Partial<NearbyPlace>) =>
    update({ nearby: items.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  const add = () => update({ nearby: [...items, makeNearby()] });
  const remove = (id: string) => update({ nearby: items.filter((n) => n.id !== id) });

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center gap-2">
        <TrainFront className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">قريب من إيه؟</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        المترو، الجامعة، المواصلات... ده بيفرق كتير مع اللي بيدوّر.
      </p>

      <div className="flex flex-col gap-3">
        {items.map((n) => {
          const isMetro = n.type === "مترو";
          const stations = n.line ? (CAIRO_METRO_LINES[n.line] ?? []) : [];
          return (
            <div key={n.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <Select
                  dir="rtl"
                  value={n.type}
                  onValueChange={(v) => {
                    const type = v as NearbyType;
                    set(n.id, { type, line: undefined, name: type === "مترو" ? "" : n.name });
                  }}
                >
                  <SelectTrigger className="w-32 bg-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEARBY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isMetro ? (
                  <Select
                    dir="rtl"
                    value={n.line ?? ""}
                    onValueChange={(v) => set(n.id, { line: v || undefined, name: "" })}
                  >
                    <SelectTrigger className="flex-1 bg-surface">
                      <SelectValue placeholder="اختار الخط" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CAIRO_METRO_LINES).map((line) => (
                        <SelectItem key={line} value={line}>
                          {line}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="ms-auto text-muted-foreground hover:text-red-600"
                  aria-label="احذف"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {isMetro && stations.length > 0 ? (
                  <Select
                    dir="rtl"
                    value={n.name || ""}
                    onValueChange={(v) => set(n.id, { name: v })}
                  >
                    <SelectTrigger className="flex-1 bg-surface">
                      <SelectValue placeholder="اختار المحطة" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={NEARBY_PLACEHOLDERS[n.type]}
                    value={n.name}
                    onChange={(e) => set(n.id, { name: e.target.value })}
                    className="flex-1"
                    disabled={isMetro && !n.line}
                  />
                )}
                <div className="flex items-center gap-1">
                  <NumberInput
                    placeholder="دقايق"
                    value={n.minutes}
                    onValueChange={(v) => set(n.id, { minutes: v })}
                    className="w-20 text-center"
                  />
                  <span className="text-[11px] text-muted-foreground">دقيقة مشي</span>
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={add} className="gap-1 self-start">
          <Plus className="h-4 w-4" />
          ضيف مكان قريب
        </Button>
      </div>
    </div>
  );
}

// ── Custom specs (مواصفات إضافية من عند المالك) ──

function CustomSpecsSection({ draft, update }: StepProps) {
  const items = draft.customSpecs ?? [];

  const set = (id: string, patch: Partial<CustomSpec>) =>
    update({ customSpecs: items.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const add = () => update({ customSpecs: [...items, makeCustomSpec()] });
  const remove = (id: string) => update({ customSpecs: items.filter((c) => c.id !== id) });

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">مواصفات إضافية من عندك</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        أي حاجة مميزة مش موجودة فوق — زي اتجاه الشمس، نوع المطبخ، التشطيب...
      </p>

      <div className="flex flex-col gap-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <Input
              placeholder="العنوان (مثلاً: اتجاه الشمس)"
              value={c.label}
              onChange={(e) => set(c.id, { label: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="القيمة (مثلاً: بحري)"
              value={c.value}
              onChange={(e) => set(c.id, { value: e.target.value })}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => remove(c.id)}
              className="text-muted-foreground hover:text-red-600"
              aria-label="احذف"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={add} className="gap-1 self-start">
          <Plus className="h-4 w-4" />
          ضيف مواصفة
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── Step 3: Rental mode ─────────────────────────

function StepRentalMode({ draft, update }: StepProps) {
  const bedrooms = draft.bedrooms ?? 2;

  const choose = (mode: RentalMode) => {
    if (mode === "whole") {
      update({
        rentalMode: mode,
        wholePrice: draft.wholePrice,
        wholeStatus: "available",
        rentToGender: undefined,
      });
    } else if (mode === "by_room") {
      const rooms =
        draft.rentalMode === "by_room" && draft.rooms?.length
          ? draft.rooms
          : Array.from({ length: bedrooms }, (_, i) => makeRoom(i + 1));
      update({ rentalMode: mode, rooms, rentToGender: draft.rentToGender });
    } else {
      const rooms =
        draft.rentalMode === "by_bed" && draft.rooms?.length
          ? draft.rooms
          : Array.from({ length: bedrooms }, (_, i) => makeRoom(i + 1, true));
      update({ rentalMode: mode, rooms, rentToGender: draft.rentToGender });
    }
  };

  const listingType = draft.listingType ?? "rent";
  const chooseOffer = (t: ListingType) => {
    if (t === "sale") {
      update({ listingType: "sale", saleStatus: draft.saleStatus ?? "available" });
    } else {
      update({ listingType: "rent" });
    }
  };

  const offerOptions: {
    id: ListingType;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "rent",
      title: "للإيجار",
      subtitle: "تأجّر الشقة، أو أوضة، أو سرير.",
      icon: KeyRound,
    },
    {
      id: "sale",
      title: "للبيع",
      subtitle: "تبيع الشقة بسعر واحد.",
      icon: Tag,
    },
  ];

  const genderOptions: { id: RentalGenderPolicy; label: string; hint: string }[] = [
    { id: "male_only", label: "شباب", hint: "للرجّالة فقط" },
    { id: "female_only", label: "بنات", hint: "للستات فقط" },
  ];

  const options: {
    id: RentalMode;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "whole",
      title: "أجّر الشقة كلها",
      subtitle: "لمستأجر واحد أو عيلة. سعر واحد للشقة بالكامل.",
      icon: Home,
    },
    {
      id: "by_room",
      title: "أجّر بالأوضة",
      subtitle: "كل أوضة تتأجّر لوحدها، وكل واحدة ليها سعرها حسب مميزاتها.",
      icon: DoorOpen,
    },
    {
      id: "by_bed",
      title: "أجّر بالسرير",
      subtitle: "سكن مشترك — كل سرير في الأوضة بسعر مختلف.",
      icon: BedDouble,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">هتعمل بيها إيه؟</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        تأجّر المكان ولا تبيعه؟ ده بيحدد شكل التسعير في الخطوة الجاية.
      </p>

      {/* Rent vs sell */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {offerOptions.map((o) => {
          const Icon = o.icon;
          const active = listingType === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => chooseOffer(o.id)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition-all ${
                active
                  ? "border-trust bg-trust-soft ring-2 ring-trust/30"
                  : "border-border bg-surface hover:border-foreground/20"
              }`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                  active ? "bg-trust text-trust-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="font-display text-sm font-semibold">{o.title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{o.subtitle}</div>
              </div>
              {active && <CheckCircle2 className="h-5 w-5 text-trust" />}
            </button>
          );
        })}
      </div>

      {listingType === "sale" ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          هتحدّد سعر البيع في الخطوة الجاية. الصور والمواصفات بتظهر زي ما هي.
        </div>
      ) : (
        <>
          <h2 className="mt-8 font-display text-xl font-semibold">هتأجّرها إزاي؟</h2>
          <div className="mt-4 flex flex-col gap-3">
            {options.map((o) => {
              const Icon = o.icon;
              const active = draft.rentalMode === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => choose(o.id)}
                  className={`flex items-center gap-4 rounded-2xl border p-5 text-start transition-all ${
                    active
                      ? "border-trust bg-trust-soft ring-2 ring-trust/30"
                      : "border-border bg-surface hover:border-foreground/20"
                  }`}
                >
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                      active ? "bg-trust text-trust-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-base font-semibold">{o.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{o.subtitle}</div>
                  </div>
                  {active && <CheckCircle2 className="h-5 w-5 text-trust" />}
                </button>
              );
            })}
          </div>

          {draft.rentalMode && draft.rentalMode !== "whole" ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
              <h3 className="font-display text-base font-semibold">هتأجّر لمين؟</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                السكن المشترك لازم يكون لجنس واحد. اختار مين ممكن يسكن — ده بيظهر في الإعلان وبيحدد
                المطابقة.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {genderOptions.map((g) => {
                  const active = draft.rentToGender === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => update({ rentToGender: g.id })}
                      className={`rounded-xl border p-3 text-start transition-all ${
                        active
                          ? "border-trust bg-trust-soft ring-2 ring-trust/30"
                          : "border-border bg-background hover:border-foreground/20"
                      }`}
                    >
                      <div className="font-display text-sm font-semibold">{g.label}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{g.hint}</div>
                    </button>
                  );
                })}
              </div>
              {!draft.rentToGender ? (
                <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                  لازم تختار عشان تكمّل.
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// ───────────────────────── Step 4: Rooms & pricing ─────────────────────────

function StepRoomsPricing({ draft, update }: StepProps) {
  const mode = draft.rentalMode;
  if (draft.listingType === "sale") return <SalePricing draft={draft} update={update} />;
  if (!mode) {
    return (
      <p className="text-sm text-muted-foreground">
        ارجع للخطوة اللي فاتت واختار نظام الإيجار الأول.
      </p>
    );
  }
  return (
    <div>
      {mode === "whole" && <WholePricing draft={draft} update={update} />}
      {mode === "by_room" && <ByRoomPricing draft={draft} update={update} />}
      {mode === "by_bed" && <ByBedPricing draft={draft} update={update} />}
      {/* Nightly booking applies to any rental mode (whole / room / bed). */}
      <NightlyToggle draft={draft} update={update} />
    </div>
  );
}

// Optional short-stay rate — monthly is the focus, this is a nice-to-have.
// Shown for every rental mode so an owner can offer nightly even for a bed/room.
// Defaults to "لأ" (no): only a positive saved rate starts it on "نعم".
function NightlyToggle({ draft, update }: StepProps) {
  const [on, setOn] = useState((draft.nightlyPrice ?? 0) > 0);

  const turnOn = () => setOn(true);
  const turnOff = () => {
    setOn(false);
    update({ nightlyPrice: undefined });
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-medium">بتأجّر بالليلة كمان؟</span>
          <p className="text-xs text-muted-foreground">
            غير الإيجار الشهري، تقدر تأجّرها كام ليلة لو حابب.
          </p>
        </div>
        <div className="flex gap-2">
          <TogglePill active={on} onClick={turnOn}>
            نعم
          </TogglePill>
          <TogglePill active={!on} onClick={turnOff}>
            لأ
          </TogglePill>
        </div>
      </div>

      {on && (
        <div className="mt-3">
          <label htmlFor="nightly-price" className="mb-1 block text-sm font-medium">
            سعر الليلة
          </label>
          <div className="flex items-center gap-2">
            <NumberInput
              id="nightly-price"
              placeholder="0"
              value={draft.nightlyPrice}
              onValueChange={(v) => update({ nightlyPrice: v })}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">ج.م / الليلة</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SalePricing({ draft, update }: StepProps) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">سعر البيع</h1>
      <p className="mt-2 text-sm text-muted-foreground">السعر الإجمالي المطلوب للشقة.</p>

      <div className="mt-8 flex flex-col gap-5">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <label htmlFor="sale-price" className="mb-2 block text-sm font-medium">
            سعر البيع
          </label>
          <div className="flex items-center gap-2">
            <NumberInput
              id="sale-price"
              placeholder="0"
              value={draft.salePrice}
              onValueChange={(v) => update({ salePrice: v ?? 0 })}
              className="text-lg font-semibold"
            />
            <span className="text-sm text-muted-foreground">ج.م</span>
          </div>

          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <span className="text-sm">السعر قابل للتفاوض</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={!!draft.negotiable}
              onChange={(e) => update({ negotiable: e.target.checked || undefined })}
            />
          </label>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">الحالة:</span>
            <TogglePill
              active={(draft.saleStatus ?? "available") === "available"}
              onClick={() => update({ saleStatus: "available" })}
            >
              متاحة
            </TogglePill>
            <TogglePill
              active={draft.saleStatus === "sold"}
              onClick={() => update({ saleStatus: "sold" })}
            >
              اتباعت
            </TogglePill>
          </div>
        </div>
      </div>
    </div>
  );
}

function WholePricing({ draft, update }: StepProps) {
  const costs = draft.costs ?? [
    { label: "النت", amount: 0 },
    { label: "الكهربا (متوسط)", amount: 0 },
    { label: "المياه", amount: 0 },
  ];
  const setCost = (idx: number, amount: number) => {
    const next = [...costs];
    next[idx] = { ...next[idx], amount };
    update({ costs: next });
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">سعر الشقة</h1>
      <p className="mt-2 text-sm text-muted-foreground">الإيجار الشهري للشقة بالكامل.</p>

      <div className="mt-8 flex flex-col gap-5">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <label htmlFor="whole-price" className="mb-2 block text-sm font-medium">
            إيجار الشقة
          </label>
          <div className="flex items-center gap-2">
            <NumberInput
              id="whole-price"
              placeholder="0"
              value={draft.wholePrice}
              onValueChange={(v) => update({ wholePrice: v ?? 0 })}
              className="text-lg font-semibold"
            />
            <span className="text-sm text-muted-foreground">ج.م / شهر</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">الحالة:</span>
            <TogglePill
              active={(draft.wholeStatus ?? "available") === "available"}
              onClick={() => update({ wholeStatus: "available" })}
            >
              فاضية
            </TogglePill>
            <TogglePill
              active={draft.wholeStatus === "occupied"}
              onClick={() => update({ wholeStatus: "occupied" })}
            >
              متأجرة
            </TogglePill>
          </div>
        </div>

        <ExtraBills costs={costs} setCost={setCost} />
      </div>
    </div>
  );
}

function ByRoomPricing({ draft, update }: StepProps) {
  const rooms = draft.rooms ?? [];

  const setRoom = (id: string, patch: Partial<Room>) =>
    update({ rooms: rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const addRoom = () => update({ rooms: [...rooms, makeRoom(rooms.length + 1)] });
  const removeRoom = (id: string) => update({ rooms: rooms.filter((r) => r.id !== id) });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">الأوض وأسعارها</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        كل أوضة ليها سعرها. الأوضة اللي فيها تكييف أو حمام خاص أو بلكونة بتستاهل سعر أعلى.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {rooms.map((room, i) => (
          <div key={room.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <Input
                value={room.name}
                onChange={(e) => setRoom(room.id, { name: e.target.value })}
                placeholder={`أوضة ${i + 1}`}
                className="max-w-xs font-medium"
              />
              {rooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRoom(room.id)}
                  className="text-muted-foreground hover:text-red-600"
                  aria-label="احذف الأوضة"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3">
              <FeatureChips
                selected={room.features}
                onToggle={(f) =>
                  setRoom(room.id, {
                    features: room.features.includes(f)
                      ? room.features.filter((x) => x !== f)
                      : [...room.features, f],
                  })
                }
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <NumberInput
                  placeholder="السعر"
                  value={room.price}
                  onValueChange={(v) => setRoom(room.id, { price: v })}
                  className="w-32 text-end font-semibold"
                />
                <span className="text-xs text-muted-foreground">ج.م/شهر</span>
              </div>
              <AvailabilityToggle
                status={room.status ?? "available"}
                onChange={(status) => setRoom(room.id, { status })}
              />
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addRoom} className="gap-1 self-start">
          <Plus className="h-4 w-4" />
          زود أوضة
        </Button>
      </div>
    </div>
  );
}

function ByBedPricing({ draft, update }: StepProps) {
  const rooms = draft.rooms ?? [];

  const setRoom = (id: string, patch: Partial<Room>) =>
    update({ rooms: rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const addRoom = () => update({ rooms: [...rooms, makeRoom(rooms.length + 1, true)] });
  const removeRoom = (id: string) => update({ rooms: rooms.filter((r) => r.id !== id) });

  const setBed = (roomId: string, bedId: string, patch: Partial<Bed>) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setRoom(roomId, {
      beds: room.beds.map((b) => (b.id === bedId ? { ...b, ...patch } : b)),
    });
  };
  const addBed = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setRoom(roomId, { beds: [...room.beds, makeBed(room.beds.length + 1)] });
  };
  const removeBed = (roomId: string, bedId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setRoom(roomId, { beds: room.beds.filter((b) => b.id !== bedId) });
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">الأوض والسراير</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        قسّم كل أوضة لسراير، وحدّد سعر كل سرير. السرير المفرد أو اللي جنب الشباك ممكن يبقى أغلى.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {rooms.map((room, i) => (
          <div key={room.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <Input
                value={room.name}
                onChange={(e) => setRoom(room.id, { name: e.target.value })}
                placeholder={`أوضة ${i + 1}`}
                className="max-w-xs font-medium"
              />
              {rooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRoom(room.id)}
                  className="text-muted-foreground hover:text-red-600"
                  aria-label="احذف الأوضة"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3">
              <FeatureChips
                selected={room.features}
                onToggle={(f) =>
                  setRoom(room.id, {
                    features: room.features.includes(f)
                      ? room.features.filter((x) => x !== f)
                      : [...room.features, f],
                  })
                }
              />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {room.beds.map((bed, bi) => (
                <div
                  key={bed.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3"
                >
                  <Input
                    value={bed.label}
                    onChange={(e) => setBed(room.id, bed.id, { label: e.target.value })}
                    placeholder={`سرير ${bi + 1}`}
                    className="w-32"
                  />
                  <div className="flex items-center gap-1">
                    <NumberInput
                      placeholder="السعر"
                      value={bed.price || undefined}
                      onValueChange={(v) => setBed(room.id, bed.id, { price: v ?? 0 })}
                      className="w-24 text-end"
                    />
                    <span className="text-[11px] text-muted-foreground">ج.م</span>
                  </div>
                  <AvailabilityToggle
                    status={bed.status}
                    onChange={(status) => setBed(room.id, bed.id, { status })}
                  />
                  {room.beds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBed(room.id, bed.id)}
                      className="ms-auto text-muted-foreground hover:text-red-600"
                      aria-label="احذف السرير"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBed(room.id)}
                className="gap-1 self-start text-trust"
              >
                <Plus className="h-3.5 w-3.5" />
                زود سرير
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addRoom} className="gap-1 self-start">
          <Plus className="h-4 w-4" />
          زود أوضة
        </Button>
      </div>
    </div>
  );
}

function ExtraBills({
  costs,
  setCost,
}: {
  costs: { label: string; amount: number }[];
  setCost: (idx: number, amount: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">تكاليف إضافية (فواتير)</label>
      <div className="flex flex-col gap-2">
        {costs.map((c, idx) => (
          <div
            key={c.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <span className="flex-1 text-sm">{c.label}</span>
            <NumberInput
              placeholder="0"
              value={c.amount || undefined}
              onValueChange={(v) => setCost(idx, v ?? 0)}
              className="w-28 text-end"
            />
            <span className="text-xs text-muted-foreground">ج.م</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">حط 0 لو الفاتورة دي محسوبة في السعر.</p>
    </div>
  );
}

// ───────────────────────── Step 5: Amenities ─────────────────────────

function StepAmenities({ draft, update }: StepProps) {
  const selected = draft.amenities ?? [];
  const [custom, setCustom] = useState("");
  const furnished = draft.furnished === true;
  const applianceSet = useMemo(() => new Set<string>(APPLIANCE_AMENITIES as readonly string[]), []);

  const toggle = (a: string) =>
    update({
      amenities: selected.includes(a) ? selected.filter((x) => x !== a) : [...selected, a],
    });

  // When the apartment isn't furnished, appliances/furniture don't apply —
  // drop any that were selected while it was furnished.
  useEffect(() => {
    if (furnished) return;
    const cur = draft.amenities ?? [];
    const pruned = cur.filter((a) => !applianceSet.has(a));
    if (pruned.length !== cur.length) update({ amenities: pruned });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [furnished]);

  const presetSet = new Set<string>(ALL_AMENITIES as readonly string[]);
  const customSelected = selected.filter((a) => !presetSet.has(a));

  const addCustom = () => {
    const v = custom.trim();
    if (!v || selected.includes(v)) {
      setCustom("");
      return;
    }
    update({ amenities: [...selected, v] });
    setCustom("");
  };

  const Grid = ({ items }: { items: readonly string[] }) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((a) => {
        const on = selected.includes(a);
        return (
          <button
            key={a}
            type="button"
            onClick={() => toggle(a)}
            className={`rounded-lg border px-3 py-2.5 text-start text-sm transition-all ${
              on
                ? "border-trust bg-trust-soft text-foreground"
                : "border-border bg-surface hover:border-foreground/20"
            }`}
          >
            {a}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
        المميزات المشتركة
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        المميزات اللي في الشقة كلها أو العمارة (مش الأوضة الواحدة).
      </p>

      {/* Building / general amenities — always shown */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-foreground">مميزات العمارة والمكان</h2>
        <Grid items={GENERAL_AMENITIES} />
      </div>

      {/* Appliances & furniture — only relevant for furnished places */}
      {furnished ? (
        <div className="mt-6">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <Sofa className="h-4 w-4 text-muted-foreground" />
            الأجهزة والفرش
          </h2>
          <Grid items={APPLIANCE_AMENITIES} />
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">
          <Sofa className="h-4 w-4 shrink-0" />
          الشقة مش مفروشة، فمفيش أجهزة أو فرش. لو فيه أجهزة، ارجع لخطوة المواصفات وخلّيها «مفروشة».
        </div>
      )}

      {/* Add your own amenity */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium">ضيف ميزة من عندك</label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="مثلاً: سخان غاز، باب أمان، إنترفون..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustom} className="gap-1">
            <Plus className="h-4 w-4" />
            ضيف
          </Button>
        </div>

        {customSelected.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {customSelected.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 rounded-full border border-trust bg-trust-soft px-2.5 py-1 text-xs text-foreground"
              >
                {a}
                <button
                  type="button"
                  onClick={() => toggle(a)}
                  className="text-muted-foreground hover:text-red-600"
                  aria-label={`احذف ${a}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Step 6: Photos ─────────────────────────

function StepPhotos({ draft, update }: StepProps) {
  const images = draft.images ?? [];
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const newOnes: string[] = [];
      for (let i = 0; i < files.length && images.length + newOnes.length < 8; i++) {
        // PROD-1: presigned upload when configured, else downscaled base64.
        newOnes.push(await uploadImage(files[i]));
      }
      update({ images: [...images, ...newOnes] });
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => update({ images: images.filter((_, i) => i !== idx) });

  // Promote any photo to be the main one (the first image is the cover used on
  // cards + the property page).
  const makeMain = (idx: number) => {
    if (idx === 0) return;
    const next = [...images];
    const [picked] = next.splice(idx, 1);
    update({ images: [picked, ...next] });
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">حطّ صور للمكان</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        3 صور على الأقل، 8 على الأكتر. اضغط «خلّيها الرئيسية» عشان تختار الصورة اللي هتظهر في
        الإعلان.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, idx) => {
          const isMain = idx === 0;
          return (
            <div
              key={idx}
              className={`group relative aspect-square overflow-hidden rounded-xl bg-muted ${
                isMain ? "ring-2 ring-trust ring-offset-2 ring-offset-background" : ""
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />

              {/* Delete */}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute end-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:text-red-600"
                aria-label="احذف الصورة"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Main badge / set-as-main control */}
              {isMain ? (
                <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-trust px-2 py-0.5 text-[10px] font-semibold text-trust-foreground">
                  <Star className="h-3 w-3 fill-current" />
                  الصورة الرئيسية
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeMain(idx)}
                  className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:bg-trust hover:text-trust-foreground"
                >
                  <Star className="h-3 w-3" />
                  خلّيها الرئيسية
                </button>
              )}
            </div>
          );
        })}

        {images.length < 8 && (
          <label
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface text-muted-foreground transition-colors hover:border-trust hover:text-trust aria-disabled:cursor-wait aria-disabled:opacity-60"
            aria-disabled={uploading}
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs font-medium">{uploading ? "بنرفع…" : "حطّ صورة"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>

      {images.length > 0 && images.length < 3 && (
        <p className="mt-4 text-xs text-amber-600">حطّ على الأقل 3 صور قبل ما تكمّل.</p>
      )}
    </div>
  );
}

// ───────────────────────── Step 7: Description ─────────────────────────

function StepDescription({ draft, update }: StepProps) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
        عرّف الناس بالمكان
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        عنوان قصير ووصف بيقول إيه اللي مميّز في المكان.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            عنوان الإعلان
          </label>
          <Input
            id="title"
            placeholder="مثال: شقة شمسها حلوة جنب الجامعة الأمريكية"
            value={draft.title ?? ""}
            onChange={(e) => update({ title: e.target.value })}
            maxLength={80}
          />
          <p className="mt-1 text-xs text-muted-foreground">{(draft.title ?? "").length}/80</p>
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            الوصف
          </label>
          <Textarea
            id="description"
            placeholder="مثال: شقة منوّرة وهادية بأوضتين، على بعد 8 دقايق من الجامعة الأمريكية. مفروشة بالكامل، نت فايبر..."
            value={draft.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
            rows={6}
            maxLength={600}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {(draft.description ?? "").length}/600
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Step 8: Review ─────────────────────────

function StepReview({ draft }: { draft: ListingDraft }) {
  const isSale = draft.listingType === "sale";
  const summary = summarizeListing({
    listingType: draft.listingType,
    salePrice: draft.salePrice,
    saleStatus: draft.saleStatus,
    rentalMode: draft.rentalMode,
    wholePrice: draft.wholePrice,
    wholeStatus: draft.wholeStatus,
    rooms: draft.rooms,
    spec: draft.unitType
      ? {
          unitType: draft.unitType,
          bedrooms: draft.bedrooms ?? 1,
          bathrooms: draft.bathrooms ?? 1,
          furnished: draft.furnished ?? false,
        }
      : undefined,
    price: (isSale ? draft.salePrice : draft.wholePrice) ?? 0,
    beds: { total: 0, available: 0, occupied: 0 },
    type: "شقة",
  });

  const modeLabel = isSale
    ? "للبيع"
    : draft.rentalMode === "whole"
      ? "الشقة بالكامل"
      : draft.rentalMode === "by_room"
        ? `${summary.beds.total} أوض للإيجار`
        : `${summary.beds.total} سرير للإيجار`;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
        راجع الإعلان قبل ما تنشره
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        شيك على المعلومات. تقدر ترجع وتعدّل أي حاجة.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
        {draft.images?.[0] && (
          <div className="aspect-[16/9] bg-muted">
            <img src={draft.images[0]} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {summary.type}
            </span>
            <span className="rounded-full bg-trust-soft px-2 py-0.5 text-xs font-medium text-trust">
              {modeLabel}
            </span>
            {draft.rentalMode !== "whole" && draft.rentToGender && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  draft.rentToGender === "male_only"
                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    : "bg-pink-500/10 text-pink-600 dark:text-pink-400"
                }`}
              >
                {draft.rentToGender === "male_only" ? "شباب" : "بنات"}
              </span>
            )}
            <span className="text-xs text-muted-foreground">جديد · لسه ما اتقيّمش</span>
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold">{draft.title}</h2>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {draft.area}
          </div>

          {draft.unitType && (
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.unitType} · {draft.bedrooms ?? 1} أوض · {draft.bathrooms ?? 1} حمام ·{" "}
              {draft.furnished ? "مفروشة" : "مش مفروشة"}
            </p>
          )}

          {draft.nearby && draft.nearby.filter((n) => n.name.trim()).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {draft.nearby
                .filter((n) => n.name.trim())
                .map((n) => {
                  const Icon = NEARBY_ICONS[n.type];
                  return (
                    <span
                      key={n.id}
                      className="inline-flex items-center gap-1 rounded-full bg-trust-soft px-2 py-0.5 text-[11px] text-trust"
                    >
                      <Icon className="h-3 w-3" />
                      {n.name}
                      {n.minutes != null ? ` · ${n.minutes} د` : ""}
                    </span>
                  );
                })}
            </div>
          )}

          {draft.customSpecs &&
            draft.customSpecs.filter((c) => c.label.trim() && c.value.trim()).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.customSpecs
                  .filter((c) => c.label.trim() && c.value.trim())
                  .map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {c.label}: {c.value}
                    </span>
                  ))}
              </div>
            )}

          <p className="mt-3 text-sm text-muted-foreground">{draft.description}</p>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 p-3">
            <span className="text-xs font-medium">الحالة</span>
            <span className="text-xs text-muted-foreground">
              {isSale
                ? (draft.saleStatus ?? "available") === "available"
                  ? "متاحة للبيع"
                  : "اتباعت"
                : draft.rentalMode === "whole"
                  ? (draft.wholeStatus ?? "available") === "available"
                    ? "فاضية"
                    : "متأجرة"
                  : `فاضي ${summary.beds.available} من ${summary.beds.total}`}
            </span>
          </div>

          <div className="mt-3 font-display text-2xl font-semibold tabular-nums">
            {!isSale && draft.rentalMode !== "whole" && (
              <span className="text-sm font-normal text-muted-foreground">يبدأ من </span>
            )}
            {summary.priceFrom.toLocaleString("ar-EG-u-nu-latn")}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {isSale ? "ج.م" : "ج.م/شهر"}
            </span>
            {isSale && draft.negotiable ? (
              <span className="ms-2 text-xs font-normal text-muted-foreground">· قابل للتفاوض</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-trust/30 bg-trust-soft p-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 text-trust" />
          عشان درجة الثقة بتاعتك تعلى:
        </div>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-xs text-muted-foreground">
          <li>
            <Link to="/dashboard/verify" className="text-trust underline hover:no-underline">
              وثّق حسابك
            </Link>{" "}
            عشان تكسب ثقة الناس بسرعة
          </li>
          <li>رد بسرعة على الناس اللي بتكلّمك</li>
          <li>الناس اللي هتسكن عندك هتقدر تقيّم المكان بعد 30 يوم</li>
        </ul>
      </div>
    </div>
  );
}

// ───────────────────────── Shared UI ─────────────────────────

type StepProps = { draft: ListingDraft; update: (p: Partial<ListingDraft>) => void };

function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  // Local text state so the user can type freely (and clear the field while
  // editing); we clamp to [min, max] on blur. The +/- buttons stay for quick nudges.
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) {
      setText(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, Math.round(n)));
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="h-9 w-9 rounded-full p-0"
        >
          −
        </Button>
        <input
          type="text"
          inputMode="numeric"
          aria-label={label}
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit((e.target as HTMLInputElement).value);
            }
          }}
          className="w-12 rounded-lg border border-transparent bg-transparent text-center font-display text-xl font-semibold tabular-nums outline-none focus:border-border focus:bg-background"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="h-9 w-9 rounded-full p-0"
        >
          +
        </Button>
      </div>
    </div>
  );
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-trust bg-trust text-trust-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AvailabilityToggle({
  status,
  onChange,
}: {
  status: BedStatus;
  onChange: (s: BedStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <TogglePill active={status === "available"} onClick={() => onChange("available")}>
        فاضي
      </TogglePill>
      <TogglePill active={status === "reserved"} onClick={() => onChange("reserved")}>
        محجوز
      </TogglePill>
      <TogglePill active={status === "occupied"} onClick={() => onChange("occupied")}>
        متأجّر
      </TogglePill>
    </div>
  );
}

function FeatureChips({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (f: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const presetSet = new Set<string>(ROOM_FEATURES as readonly string[]);
  const customFeatures = selected.filter((f) => !presetSet.has(f));

  const addCustom = () => {
    const v = custom.trim();
    if (!v) {
      setCustom("");
      return;
    }
    if (!selected.includes(v)) onToggle(v);
    setCustom("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {ROOM_FEATURES.map((f) => {
          const on = selected.includes(f);
          return (
            <button
              key={f}
              type="button"
              onClick={() => onToggle(f)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                on
                  ? "border-trust bg-trust-soft text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          );
        })}

        {/* Custom features the owner typed, shown as removable chips */}
        {customFeatures.map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-1 rounded-full border border-trust bg-trust-soft px-2.5 py-1 text-xs text-foreground"
          >
            {f}
            <button
              type="button"
              onClick={() => onToggle(f)}
              className="text-muted-foreground hover:text-red-600"
              aria-label={`احذف ${f}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          placeholder="ضيف ميزة للأوضة دي…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          className="h-8 max-w-[200px] text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          className="h-8 gap-1 px-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          ضيف
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── Validation + draft → property ─────────────────────────

function validateStep(step: StepId, d: ListingDraft): boolean {
  switch (step) {
    case 1:
      return !!d.area && !!d.address && d.address.trim().length >= 5;
    case 2:
      return (
        !!d.unitType &&
        (d.bedrooms ?? 0) >= 1 &&
        (d.bathrooms ?? 0) >= 1 &&
        (d.floor ?? -1) >= 0 &&
        (d.sizeM2 ?? 0) >= 1
      );
    case 3:
      // For sale, the offer choice alone is enough; price is validated in step 4.
      if (d.listingType === "sale") return true;
      if (!d.rentalMode) return false;
      // Shared rentals must target one gender — no "anyone" option.
      if (d.rentalMode !== "whole")
        return d.rentToGender === "male_only" || d.rentToGender === "female_only";
      return true;
    case 4: {
      if (d.listingType === "sale") return (d.salePrice ?? 0) > 0;
      // Nightly is optional; a 0/empty rate just means "not offered" (see draftToProperty).
      if (d.rentalMode === "whole") return (d.wholePrice ?? 0) > 0;
      if (d.rentalMode === "by_room")
        return (d.rooms?.length ?? 0) >= 1 && (d.rooms ?? []).every((r) => (r.price ?? 0) > 0);
      if (d.rentalMode === "by_bed") {
        const beds = (d.rooms ?? []).flatMap((r) => r.beds);
        return beds.length >= 1 && beds.every((b) => b.price > 0);
      }
      return false;
    }
    case 5:
      return true; // shared amenities optional
    case 6:
      return (d.images?.length ?? 0) >= 3;
    case 7:
      return !!d.title && d.title.length >= 6 && !!d.description && d.description.length >= 20;
    case 8:
      return true;
  }
}

function draftToProperty(
  d: ListingDraft,
  ownerId: string,
  ownerName: string,
  existing?: Property,
): Property {
  const id = existing?.id ?? `p-${Date.now()}`;
  const spec = {
    unitType: d.unitType ?? "شقة",
    bedrooms: d.bedrooms ?? 2,
    bathrooms: d.bathrooms ?? 1,
    floor: d.floor,
    sizeM2: d.sizeM2,
    furnished: d.furnished ?? false,
  };
  const isSale = d.listingType === "sale";
  const base = {
    listingType: d.listingType,
    salePrice: d.salePrice,
    saleStatus: d.saleStatus,
    rentalMode: d.rentalMode,
    wholePrice: d.wholePrice,
    wholeStatus: d.wholeStatus,
    rooms: d.rooms,
    spec,
    price: (isSale ? d.salePrice : d.wholePrice) ?? 0,
    beds: { total: 0, available: 0, occupied: 0 },
    type: "شقة" as const,
  };
  const summary = summarizeListing(base);

  const rentLabel =
    d.rentalMode === "whole"
      ? "إيجار الشقة"
      : d.rentalMode === "by_room"
        ? "أرخص أوضة"
        : "أرخص سرير";

  return {
    id,
    ownerId: existing?.ownerId ?? ownerId,
    title: d.title ?? "إعلان جديد",
    area: d.area ?? "",
    address: d.address ?? "",
    lat: d.lat,
    lng: d.lng,
    type: summary.type,
    status: existing?.status ?? "published",
    price: summary.priceFrom,
    priceFrom: summary.priceFrom,
    // Preserve trust / reputation / reviews when editing — these are earned, not set.
    trust: existing?.trust ?? 6.5,
    verified: existing?.verified ?? false,
    reviewsCount: existing?.reviewsCount ?? 0,
    residents: existing?.residents ?? 0,
    internet: existing?.internet ?? 7.5,
    image: d.images?.[0] ?? "",
    images: d.images ?? [],
    description: d.description ?? "",
    quality: existing?.quality ?? {
      internet: 7.5,
      safety: 7.5,
      noise: 7.5,
      maintenance: 7.5,
      cleanliness: 7.5,
    },
    amenities: d.amenities ?? [],
    costs: isSale
      ? []
      : [
          { label: rentLabel, amount: summary.priceFrom },
          ...(d.costs ?? []).filter((c) => c.amount > 0),
        ],
    beds: summary.beds,
    rentalMode: isSale ? undefined : d.rentalMode,
    rentToGender: isSale || d.rentalMode === "whole" ? undefined : d.rentToGender,
    listingType: d.listingType ?? "rent",
    salePrice: isSale ? d.salePrice : undefined,
    saleStatus: isSale ? (d.saleStatus ?? "available") : undefined,
    negotiable: isSale ? d.negotiable : undefined,
    spec,
    wholePrice: isSale ? undefined : d.wholePrice,
    wholeStatus: isSale ? undefined : d.wholeStatus,
    nightlyPrice: isSale ? undefined : d.nightlyPrice || undefined,
    rooms: isSale ? undefined : d.rooms,
    nearby: (d.nearby ?? []).filter((n) => n.name.trim()),
    customSpecs: (d.customSpecs ?? []).filter((c) => c.label.trim() && c.value.trim()),
    landlord: existing?.landlord ?? {
      id: ownerId,
      name: ownerName,
      initials: initialsOf(ownerName),
      trust: 6.5,
      responseRate: 0,
      verified: false,
    },
    reviews: existing?.reviews ?? [],
    qa: existing?.qa ?? [],
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + "." + parts[1][0];
}

// referenced only in JSX above
void Building2;
