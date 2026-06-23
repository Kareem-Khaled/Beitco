import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  MapPin,
  Home,
  CalendarClock,
  ListChecks,
  TrainFront,
  Sofa,
  Briefcase,
  Users2,
  Cigarette,
  Sparkles,
  Check,
  Search,
  Plus,
  X,
  KeyRound,
  Tag,
} from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import {
  AREA_OPTIONS,
  ALL_AMENITIES,
  OCCUPATIONS,
  FURNISHED_PREFS,
  CAIRO_METRO_LINES,
  profileCompleteness,
} from "@/lib/beitco/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import type { RenterProfile, PropertyType, Occupation, FurnishedPref } from "@/lib/beitco/types";

export const Route = createFileRoute("/me/preferences")({
  component: PreferencesPage,
});

const TYPES: PropertyType[] = ["شقة", "أوضة", "سرير"];

function PreferencesPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<RenterProfile>(() => user?.profile ?? {});
  const [saved, setSaved] = useState(false);
  const [areaQuery, setAreaQuery] = useState("");
  const [customAmenity, setCustomAmenity] = useState("");

  const set = (patch: Partial<RenterProfile>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };

  const toggleArr = <K extends "areas" | "lookingFor" | "mustHaveAmenities">(
    key: K,
    value: string,
  ) => {
    const cur = (draft[key] as string[] | undefined) ?? [];
    set({
      [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    } as Partial<RenterProfile>);
  };

  const completeness = useMemo(() => profileCompleteness(draft), [draft]);
  const intent = draft.intent ?? "rent";
  const lookingFor = draft.lookingFor ?? [];
  // Housemate-only fields (gender of flatmates, smoking) only matter when the
  // renter wants shared housing — a bed or a private room, not a whole flat or a purchase.
  const wantsShared = intent === "rent" && lookingFor.some((t) => t === "سرير" || t === "أوضة");
  const setIntent = (next: "rent" | "buy") =>
    next === "buy" ? set({ intent: "buy", lookingFor: ["شقة"] }) : set({ intent: "rent" });
  const selectedAreas = draft.areas ?? [];
  const selectedAmenities = draft.mustHaveAmenities ?? [];
  const amenityPresetSet = new Set<string>(ALL_AMENITIES as readonly string[]);
  const metroLines = Object.keys(CAIRO_METRO_LINES);
  const filteredAreas = AREA_OPTIONS.filter(
    (a) =>
      !selectedAreas.includes(a) &&
      (areaQuery.trim() ? a.toLowerCase().includes(areaQuery.trim().toLowerCase()) : true),
  );

  const addArea = (area: string) => {
    if (selectedAreas.includes(area)) return;
    set({ areas: [...selectedAreas, area] });
    setAreaQuery("");
  };

  const removeArea = (area: string) => {
    set({ areas: selectedAreas.filter((a) => a !== area) });
  };

  const addCustomAmenity = () => {
    const value = customAmenity.trim();
    if (!value || selectedAmenities.includes(value)) {
      setCustomAmenity("");
      return;
    }
    set({ mustHaveAmenities: [...selectedAmenities, value] });
    setCustomAmenity("");
  };

  const onSave = () => {
    updateUser({ profile: { ...draft, updatedAt: new Date().toISOString() } });
    // Preferences changed -> recompute matches (server in API mode, store in mock).
    qc.invalidateQueries({ queryKey: ["matches"] });
    setSaved(true);
    toast.success("اتحفظت تفضيلاتك");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">تفضيلاتي</h1>
          <p className="text-sm text-muted-foreground">
            قولنا بتدوّر على إيه، وهنلاقيلك الأماكن اللي تناسبك بالظبط.
          </p>
        </div>
        <div className="text-end">
          <div className="text-xs text-muted-foreground">اكتمال الملف</div>
          <div className="font-display text-xl font-semibold tabular-nums text-trust">
            {completeness}%
          </div>
        </div>
      </header>

      {/* Rent vs buy intent — drives the rest of the form + matching */}
      <Section
        icon={KeyRound}
        title="بتدوّر على إيجار ولا تمليك؟"
        hint="ده بيغيّر شكل التفضيلات والأماكن اللي هنرشّحها."
      >
        <div className="grid max-w-sm grid-cols-2 gap-2">
          {(
            [
              { id: "rent", label: "إيجار", icon: KeyRound },
              { id: "buy", label: "تمليك", icon: Tag },
            ] as const
          ).map((o) => {
            const active = intent === o.id;
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setIntent(o.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  active
                    ? "border-trust bg-trust-soft text-foreground ring-2 ring-trust/30"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {o.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Budget */}
      <Section
        icon={Wallet}
        title="الميزانية"
        hint={intent === "buy" ? "أقصى سعر مناسب ليك للشراء." : "الإيجار الشهري اللي يريّحك."}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <NumberInput
              placeholder="من"
              value={draft.budgetMin}
              onValueChange={(v) => set({ budgetMin: v })}
              className="w-28 text-center"
            />
            <span className="text-sm text-muted-foreground">—</span>
            <NumberInput
              placeholder="لـ"
              value={draft.budgetMax}
              onValueChange={(v) => set({ budgetMax: v })}
              className="w-28 text-center"
            />
            <span className="text-sm text-muted-foreground">
              {intent === "buy" ? "ج.م" : "ج.م/شهر"}
            </span>
          </div>
        </div>
      </Section>

      {/* Type — renters only (buying is whole apartments) */}
      {intent === "rent" && (
        <Section icon={Home} title="بتدوّر على إيه؟" hint="تقدر تختار أكتر من نوع.">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Chip
                key={t}
                active={lookingFor.includes(t)}
                onClick={() => toggleArr("lookingFor", t)}
              >
                {t}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {/* Areas */}
      <Section icon={MapPin} title="المناطق المفضلة" hint="اختار اللي يناسبك.">
        <div className="space-y-3">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={areaQuery}
              onChange={(e) => setAreaQuery(e.target.value)}
              placeholder="اكتب المنطقة (مثلاً: المعادي أو الزمالك)"
              className="pe-9"
            />
          </div>

          {selectedAreas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAreas.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-full border border-trust bg-trust-soft px-3 py-1.5 text-sm"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() => removeArea(a)}
                    className="text-muted-foreground hover:text-red-600"
                    aria-label={`احذف ${a}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="max-h-48 overflow-auto rounded-xl border border-border bg-surface p-2">
            <div className="flex flex-wrap gap-2">
              {filteredAreas.slice(0, 20).map((a) => (
                <Chip key={a} active={false} onClick={() => addArea(a)}>
                  {a}
                </Chip>
              ))}
            </div>
            {filteredAreas.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">مفيش مناطق تانية مطابقة للبحث.</p>
            ) : null}
          </div>
        </div>
      </Section>

      {/* Move-in date — renters only */}
      {intent === "rent" && (
        <Section icon={CalendarClock} title="هتنقل إمتى؟" hint="تقريبًا — عشان نرتّب الأولوية.">
          <div className="max-w-xs">
            <DatePicker
              value={draft.moveInBy}
              onChange={(v) => set({ moveInBy: v })}
              disablePast
              placeholder="اختار تاريخ تقريبي"
            />
          </div>
        </Section>
      )}

      {/* Must-have amenities — renters only */}
      {intent === "rent" && (
        <Section icon={ListChecks} title="لازم يكون فيه إيه؟" hint="المميزات اللي مش هتتنازل عنها.">
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_AMENITIES.map((a) => {
                const active = selectedAmenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArr("mustHaveAmenities", a)}
                    className={`rounded-xl border px-3 py-2 text-start text-sm transition-colors ${
                      active
                        ? "border-trust bg-trust-soft text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>

            {selectedAmenities.some((a) => !amenityPresetSet.has(a)) ? (
              <div className="flex flex-wrap gap-2">
                {selectedAmenities
                  .filter((a) => !amenityPresetSet.has(a))
                  .map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full border border-trust bg-trust-soft px-3 py-1.5 text-sm"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => toggleArr("mustHaveAmenities", a)}
                        className="text-muted-foreground hover:text-red-600"
                        aria-label={`احذف ${a}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
              </div>
            ) : null}

            <div className="rounded-xl border border-dashed border-border bg-surface p-3">
              <div className="mb-2 text-xs text-muted-foreground">ضيف حاجة مخصوصة تهمك</div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  placeholder="مثلاً: رووف، دش مركزي، انتركم فيديو"
                  className="max-w-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomAmenity();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomAmenity}>
                  <Plus className="me-1 h-4 w-4" />
                  ضيف
                </Button>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Transport */}
      <Section icon={TrainFront} title="المواصلات" hint="قربك من المترو والمواصلات.">
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <TrainFront className="h-4 w-4 text-muted-foreground" />
              عايز أكون قريب من المترو
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={!!draft.nearMetro}
              onChange={(e) => set({ nearMetro: e.target.checked || undefined })}
            />
          </label>

          {draft.nearMetro && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-2 text-sm font-medium">خطوط مترو مفضلة</div>
              <div className="flex flex-wrap gap-2">
                {metroLines.map((line) => (
                  <Chip
                    key={line}
                    active={(draft.metroLines ?? []).includes(line)}
                    onClick={() => {
                      const cur = draft.metroLines ?? [];
                      set({
                        metroLines: cur.includes(line)
                          ? cur.filter((l) => l !== line)
                          : [...cur, line],
                      });
                    }}
                  >
                    {line}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <TrainFront className="h-4 w-4 text-muted-foreground" />
              مهم عندي مواصلات عامة قريبة
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={!!draft.nearTransit}
              onChange={(e) => set({ nearTransit: e.target.checked || undefined })}
            />
          </label>

          {(draft.nearMetro || draft.nearTransit) && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <label htmlFor="max-walk-minutes" className="mb-2 block text-sm font-medium">
                أقصى مشي للمواصلات (دقيقة)
              </label>
              <NumberInput
                id="max-walk-minutes"
                min={1}
                max={45}
                value={draft.maxWalkMinutes}
                onValueChange={(v) => set({ maxWalkMinutes: v })}
                placeholder="مثلاً: 10"
                className="max-w-[150px]"
              />
            </div>
          )}
        </div>
      </Section>

      {/* Furnishing — only relevant for renters */}
      {intent === "rent" && (
        <Section icon={Sofa} title="الفرش" hint="الشقة تكون مفروشة قد إيه.">
          <div className="flex flex-wrap gap-2">
            {FURNISHED_PREFS.map((f) => (
              <Chip
                key={f.id}
                active={(draft.furnishedPref ?? "any") === f.id}
                onClick={() => set({ furnishedPref: f.id as FurnishedPref })}
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {/* About you — renter context (reassures owners); not shown for buyers */}
      {intent === "rent" && (
        <Section icon={Users2} title="عنك إنت" hint="بيساعد أصحاب البيوت يطمنّوا ليك.">
          <div className="space-y-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                بتشتغل إيه؟
              </div>
              <div className="flex flex-wrap gap-2">
                {OCCUPATIONS.map((o) => (
                  <Chip
                    key={o}
                    active={draft.occupation === o}
                    onClick={() =>
                      set({ occupation: draft.occupation === o ? undefined : (o as Occupation) })
                    }
                  >
                    {o}
                  </Chip>
                ))}
              </div>
            </div>

            {wantsShared && (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm">
                  <Cigarette className="h-4 w-4 text-muted-foreground" />
                  مدخّن
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={!!draft.smoker}
                  onChange={(e) => set({ smoker: e.target.checked || undefined })}
                />
              </label>
            )}

            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                كلمتين عنك (اختياري)
              </div>
              <Textarea
                placeholder="مثلاً: طالب هادي، بحب النضافة، بشتغل من البيت..."
                rows={3}
                className="resize-none"
                value={draft.bio ?? ""}
                onChange={(e) => set({ bio: e.target.value || undefined })}
                maxLength={300}
              />
            </div>
          </div>
        </Section>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
        <span className="text-xs text-muted-foreground">
          {saved ? "اتحفظت تفضيلاتك" : "غيّرت حاجة؟ متنساش تحفظ."}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/me/matches" })}>
            شوف اللي يناسبك
          </Button>
          <Button onClick={onSave} className="gap-1">
            <Check className="h-4 w-4" />
            احفظ
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-trust-soft text-trust">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Chip({
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
