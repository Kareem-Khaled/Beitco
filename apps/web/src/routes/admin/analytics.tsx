import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, Users, Home, Inbox, KeyRound, MapPin } from "lucide-react";
import { useAdminTimeseries, useAdminFunnel, useAdminAreas } from "@/lib/beitco/queries";
import type { TimeseriesMetric } from "@/lib/beitco/types";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const ar = (n: number) => n.toLocaleString("ar-EG-u-nu-latn");

const METRICS: { id: TimeseriesMetric; label: string; icon: typeof Users }[] = [
  { id: "signups", label: "اشتراكات", icon: Users },
  { id: "listings", label: "إعلانات", icon: Home },
  { id: "leads", label: "طلبات معاينة", icon: Inbox },
  { id: "tenancies", label: "سكنات", icon: KeyRound },
];

function AdminAnalytics() {
  const [metric, setMetric] = useState<TimeseriesMetric>("signups");
  const [days, setDays] = useState(30);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">التحليلات</h1>
        <p className="text-sm text-muted-foreground">
          شوف نمو المنصة، رحلة المستخدم، والعرض والطلب.
        </p>
      </header>

      {/* Growth time-series */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {METRICS.map((m) => {
              const active = metric === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetric(m.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {[30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  days === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {ar(d)} يوم
              </button>
            ))}
          </div>
        </div>
        <TimeseriesChart metric={metric} days={days} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <FunnelPanel />
        <AreasPanel />
      </div>
    </div>
  );
}

function TimeseriesChart({ metric, days }: { metric: TimeseriesMetric; days: number }) {
  const { data, isLoading } = useAdminTimeseries(metric, days);
  if (isLoading || !data) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted/50" />;
  }
  const max = Math.max(1, ...data.points.map((p) => p.count));
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold tabular-nums">{ar(data.total)}</span>
        <span className="text-xs text-muted-foreground">إجمالي آخر {ar(days)} يوم</span>
      </div>
      <div className="flex h-40 items-end gap-px">
        {data.points.map((p) => (
          <div
            key={p.date}
            className="group relative flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
            style={{ height: `${Math.max(2, (p.count / max) * 100)}%` }}
            title={`${p.date}: ${p.count}`}
          >
            {p.count > 0 ? (
              <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
                {ar(p.count)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{data.points[0]?.date.slice(5)}</span>
        <span>{data.points[data.points.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function FunnelPanel() {
  const { data, isLoading } = useAdminFunnel();
  if (isLoading || !data) return <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />;

  const max = Math.max(1, ...data.stages.map((s) => s.value));
  const rateRows = [
    { label: "مستخدم → طلب معاينة", value: data.rates.userToLead },
    { label: "طلب → موافقة", value: data.rates.leadToApproved },
    { label: "موافقة → سكن", value: data.rates.approvedToMoveIn },
    { label: "طلب → سكن", value: data.rates.leadToMoveIn },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 inline-flex items-center gap-2 font-display text-base font-semibold">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        رحلة التحوّل
      </h3>
      <div className="space-y-2">
        {data.stages.map((s) => (
          <div key={s.key}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums">{ar(s.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-trust"
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
        {rateRows.map((r) => (
          <div key={r.label} className="rounded-xl bg-surface p-2.5 text-center">
            <p className="font-display text-lg font-semibold tabular-nums">
              {r.value.toLocaleString("ar-EG")}%
            </p>
            <p className="text-[11px] text-muted-foreground">{r.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AreasPanel() {
  const { data, isLoading } = useAdminAreas();
  if (isLoading || !data) return <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />;

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-1 inline-flex items-center gap-2 font-display text-base font-semibold">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        العرض والطلب بالمنطقة
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        فجوة موجبة = طلب أكتر من المعروض (محتاجين إعلانات هنا).
      </p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">المنطقة</th>
              <th className="px-3 py-2 text-center font-medium">معروض</th>
              <th className="px-3 py-2 text-center font-medium">طلب</th>
              <th className="px-3 py-2 text-center font-medium">الفجوة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.slice(0, 12).map((r) => (
              <tr key={r.area}>
                <td className="px-3 py-2">{r.area}</td>
                <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                  {ar(r.supply)}
                </td>
                <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                  {ar(r.demand)}
                </td>
                <td
                  className={`px-3 py-2 text-center font-medium tabular-nums ${
                    r.gap > 0 ? "text-trust" : r.gap < 0 ? "text-muted-foreground" : ""
                  }`}
                >
                  {r.gap > 0 ? "+" : ""}
                  {ar(r.gap)}
                </td>
              </tr>
            ))}
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  لسه مفيش بيانات
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
