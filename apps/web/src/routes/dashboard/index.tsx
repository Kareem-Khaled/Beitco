import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Home,
  BedDouble,
  Inbox,
  Star,
  TrendingUp,
  Plus,
  Eye,
  Heart,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { getOwnerAnalytics, ownerAnalyticsFromData } from "@/lib/beitco/store";
import { USE_API } from "@/lib/beitco/api";
import { useOwnerProperties, useOwnerLeads } from "@/lib/beitco/queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { user } = useAuth();
  const { data: properties = [] } = useOwnerProperties(user?.id);
  const { data: leads = [] } = useOwnerLeads(user?.id);
  const { totalBeds, freeBeds, avgTrust, totalReviews, pendingLeads, analytics } = useMemo(() => {
    const totalBeds = properties.reduce((s, p) => s + p.beds.total, 0);
    const freeBeds = properties.reduce((s, p) => s + p.beds.available, 0);
    const avgTrust = properties.length
      ? properties.reduce((s, p) => s + p.trust, 0) / properties.length
      : 0;
    const totalReviews = properties.reduce((s, p) => s + p.reviewsCount, 0);
    const pendingLeads = leads.filter((l) => l.status === "pending").length;
    // Analytics: mock reads localStorage (real saves+leads, estimate views);
    // API estimates views/saves but counts real leads from the owner-leads API.
    const analytics =
      USE_API || !user ? ownerAnalyticsFromData(properties, leads) : getOwnerAnalytics(user.id);
    return { totalBeds, freeBeds, avgTrust, totalReviews, pendingLeads, analytics };
  }, [user, properties, leads]);
  const responseRate = user?.responseRate;

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">لوحتي</h1>
          <p className="text-sm text-muted-foreground">
            شوف شققك وطلبات المعاينة كلها في مكان واحد.
          </p>
        </div>
        <Button asChild>
          <Link to="/list/new">
            <Plus className="me-1 h-4 w-4" />
            اعرض مكان جديد
          </Link>
        </Button>
      </header>

      {properties.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Home className="h-4 w-4" />}
              label="عدد الشقق"
              value={properties.length.toLocaleString("ar-EG-u-nu-latn")}
            />
            <StatCard
              icon={<BedDouble className="h-4 w-4" />}
              label="سراير فاضية"
              value={`${freeBeds.toLocaleString("ar-EG-u-nu-latn")} / ${totalBeds.toLocaleString("ar-EG-u-nu-latn")}`}
            />
            <StatCard
              icon={<Inbox className="h-4 w-4" />}
              label="طلبات معاينة جديدة"
              value={pendingLeads.toLocaleString("ar-EG-u-nu-latn")}
              accent={pendingLeads > 0}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="متوسط درجة الثقة"
              value={avgTrust ? avgTrust.toFixed(1) : " - "}
            />
          </section>

          {/* Analytics */}
          {analytics && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-trust" />
                <h2 className="font-display text-base font-semibold">أداء إعلاناتك</h2>
                <span className="ms-auto text-[11px] text-muted-foreground">آخر فترة</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  icon={<Eye className="h-4 w-4" />}
                  label="مشاهدات"
                  value={analytics.views}
                />
                <Metric icon={<Heart className="h-4 w-4" />} label="حفظ" value={analytics.saves} />
                <Metric
                  icon={<Inbox className="h-4 w-4" />}
                  label="طلبات معاينة"
                  value={analytics.leads}
                />
                <Metric
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="نسبة التحويل"
                  value={`${(analytics.conversion * 100).toFixed(1)}%`}
                  raw
                />
              </div>

              {/* Per-listing breakdown */}
              {analytics.perListing.length > 1 && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">حسب الإعلان</div>
                  <ul className="space-y-2">
                    {analytics.perListing
                      .sort((a, b) => b.analytics.views - a.analytics.views)
                      .slice(0, 5)
                      .map(({ property, analytics: a }) => (
                        <li
                          key={property.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <Link
                            to="/property/$id"
                            params={{ id: property.id }}
                            className="min-w-0 flex-1 truncate text-foreground hover:underline"
                          >
                            {property.title}
                          </Link>
                          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {a.views.toLocaleString("ar-EG-u-nu-latn")}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {a.saves.toLocaleString("ar-EG-u-nu-latn")}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Inbox className="h-3 w-3" />
                              {a.leads.toLocaleString("ar-EG-u-nu-latn")}
                            </span>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Responsiveness  -  real, tied to trust (T-3) */}
          {responseRate != null && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                      responseRate >= 85 ? "bg-trust-soft text-trust" : "bg-warning/10 text-warning"
                    }`}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl font-semibold tabular-nums">
                        {responseRate.toLocaleString("ar-EG-u-nu-latn")}%
                      </span>
                      <h2 className="text-sm font-medium text-muted-foreground">بترد بسرعة</h2>
                    </div>
                    <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                      {responseRate >= 85
                        ? "ممتاز  -  ردّك السريع بيرفع درجة ثقتك وبيخلّي الناس تكلّمك أكتر."
                        : "لو بتردّ على الرسايل في خلال يوم، درجة ثقتك بتزيد والناس بتطمّن أكتر."}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/messages">
                    <MessageCircle className="me-1 h-4 w-4" />
                    روح للرسايل
                  </Link>
                </Button>
              </div>
              {/* Progress to the "fast responder" bar (85%) */}
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    responseRate >= 85 ? "bg-trust" : "bg-warning"
                  }`}
                  style={{ inlineSize: `${Math.min(100, responseRate)}%` }}
                />
              </div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="آخر طلبات المعاينة"
              cta={
                <Link to="/dashboard/leads" className="text-xs text-primary">
                  شوفهم كلهم
                </Link>
              }
            >
              {leads.length === 0 ? (
                <Empty mini text="لسه ما جالكش طلبات." />
              ) : (
                <ul className="divide-y divide-border">
                  {leads.slice(0, 4).map((l) => {
                    const p = properties.find((pp) => pp.id === l.propertyId);
                    return (
                      <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{l.renterName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p?.title ?? " - "}
                          </p>
                        </div>
                        <LeadPill status={l.status} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              title="آخر آراء الناس"
              cta={
                <Link to="/dashboard/reviews" className="text-xs text-primary">
                  شوفهم كلهم
                </Link>
              }
            >
              {totalReviews === 0 ? (
                <Empty mini text="لسه ما حدش كتب رأيه." />
              ) : (
                <ul className="space-y-3">
                  {properties
                    .flatMap((p) => p.reviews.map((r) => ({ r, p })))
                    .slice(0, 3)
                    .map(({ r, p }) => (
                      <li key={r.id} className="rounded-lg border border-border bg-surface p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{r.author}</span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {r.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm">{r.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{p.title}</p>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  raw,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  raw?: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 font-display text-xl font-semibold tabular-nums">
        {raw ? value : (value as number).toLocaleString("ar-EG-u-nu-latn")}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Panel({
  title,
  cta,
  children,
}: {
  title: string;
  cta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {cta}
      </div>
      {children}
    </div>
  );
}

function Empty({ text, mini }: { text: string; mini?: boolean }) {
  return (
    <p className={`text-center text-muted-foreground ${mini ? "py-4 text-xs" : "py-8 text-sm"}`}>
      {text}
    </p>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Home className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold">لسه ما حطّيتش ولا شقة</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        ابدأ دلوقتي وحط أول شقة. الموضوع بياخد دقايق.
      </p>
      <Button asChild className="mt-4">
        <Link to="/list/new">
          <Plus className="me-1 h-4 w-4" />
          اعرض مكانك
        </Link>
      </Button>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "معلّق",
  approved: "اتقبل",
  declined: "اترفض",
  completed: "خلص",
};

function LeadPill({ status }: { status: string }) {
  const tone =
    status === "pending"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : status === "approved"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : status === "declined"
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
