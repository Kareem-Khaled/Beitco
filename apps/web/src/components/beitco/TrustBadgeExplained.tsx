import { ShieldCheck, Star, Users, MessageCircle, Activity, HelpCircle, Clock, Sparkles } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TrustBreakdown } from "@/lib/beitco/types";

type TrustInputs = {
  score: number;
  verified: boolean;
  reviewsCount: number;
  responseRate?: number;
  residents?: number;
  breakdown?: TrustBreakdown; // when present, show the real computed contributions
};

// Egyptian-Arabic labels + icons for each computed trust component.
const COMPONENT_META: {
  key: keyof TrustBreakdown["components"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "verification", label: "التوثيق", icon: ShieldCheck },
  { key: "reviews", label: "آراء الساكنين", icon: Star },
  { key: "responsiveness", label: "سرعة الرد", icon: MessageCircle },
  { key: "tenure", label: "مدة سكن الناس", icon: Clock },
  { key: "recency", label: "نشاط قريّب", icon: Sparkles },
];

// A TrustBadge with a "ليه الدرجة دي؟" popover that breaks the score into its
// components — transparency is the whole point of the trust wedge.
export function TrustBadgeExplained({
  score,
  verified,
  reviewsCount,
  responseRate,
  residents,
  breakdown,
}: TrustInputs) {
  // Legacy descriptive rows (used when no computed breakdown is supplied).
  const rows: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; good: boolean }[] = [
    {
      icon: ShieldCheck,
      label: "التوثيق",
      value: verified ? "موثّق" : "لسه",
      good: verified,
    },
    {
      icon: Star,
      label: "آراء الساكنين",
      value: reviewsCount.toLocaleString("ar-EG-u-nu-latn"),
      good: reviewsCount >= 5,
    },
    {
      icon: MessageCircle,
      label: "سرعة الرد",
      value: responseRate != null ? `${responseRate}%` : "—",
      good: (responseRate ?? 0) >= 85,
    },
    {
      icon: Users,
      label: "ساكنين قبل كده",
      value: (residents ?? 0).toLocaleString("ar-EG-u-nu-latn"),
      good: (residents ?? 0) >= 3,
    },
  ];

  // Largest contributor — highlighted as "أكتر حاجة رفعت الدرجة".
  const topKey = breakdown
    ? COMPONENT_META.reduce(
        (best, m) =>
          breakdown.components[m.key] > breakdown.components[best.key] ? m : best,
        COMPONENT_META[0],
      ).key
    : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1" aria-label="ليه الدرجة دي؟">
          <TrustBadge score={score} />
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent dir="rtl" align="end" className="w-72">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-trust" />
          <h4 className="text-sm font-semibold">ليه الدرجة دي؟</h4>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          درجة الثقة بنحسبها من كذا حاجة — مش رقم عشوائي.
        </p>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-trust-soft px-3 py-2">
          <span className="text-sm font-medium">الدرجة</span>
          <span className="font-display text-lg font-semibold tabular-nums text-trust">
            {score.toFixed(1)}{" "}
            <span className="text-xs font-normal text-muted-foreground">/ 10</span>
          </span>
        </div>

        {breakdown ? (
          <>
            <ul className="mt-3 space-y-2.5">
              {COMPONENT_META.map((m) => {
                const Icon = m.icon;
                const pts = breakdown.components[m.key];
                // Bar width relative to the score (visual weight of each factor).
                const pct = score > 0 ? Math.min(100, Math.round((pts / score) * 100)) : 0;
                return (
                  <li key={m.key} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                        {m.label}
                        {m.key === topKey && pts > 0 ? (
                          <span className="rounded-full bg-trust-soft px-1.5 text-[10px] font-medium text-trust">
                            الأعلى
                          </span>
                        ) : null}
                      </span>
                      <span className="font-medium tabular-nums text-trust">
                        +{pts.toLocaleString("ar-EG-u-nu-latn", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-trust/70" style={{ inlineSize: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>

            {breakdown.capped ? (
              <p className="mt-3 rounded-lg bg-warning/10 px-2.5 py-1.5 text-[11px] text-warning">
                الدرجة محدودة لحد ٧٫٠ لغاية ما الحساب يتأكد (التوثيق).
              </p>
            ) : null}
          </>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {r.label}
                  </span>
                  <span
                    className={`font-medium tabular-nums ${
                      r.good ? "text-trust" : "text-muted-foreground"
                    }`}
                  >
                    {r.value}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
          الدرجة بتتحدّث مع كل رأي أو تفاعل جديد.
        </p>
      </PopoverContent>
    </Popover>
  );
}
