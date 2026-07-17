import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Home,
  ShieldCheck,
  Inbox,
  BedDouble,
  Star,
  MessageSquare,
  Bell,
  ShieldAlert,
  ScanFace,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useAdminStats } from "@/lib/beitco/queries";
import { formatDate } from "@/lib/beitco/store";
import type { PlatformStats } from "@/lib/beitco/types";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const ar = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("ar-EG-u-nu-latn");

function AdminOverview() {
  const { data: s, isLoading } = useAdminStats();

  if (isLoading || !s) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        بنحمّل الأرقام…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">نظرة عامة على المنصة</h1>
        <p className="text-sm text-muted-foreground">كل اللي بيحصل في بيتون في مكان واحد.</p>
      </header>

      {/* Action queues — what needs the team's attention */}
      {(s.queues.pendingListings > 0 || s.queues.pendingVerifications > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <QueueAlert
            to="/dashboard/moderation"
            icon={ShieldAlert}
            count={s.queues.pendingListings}
            label="إعلانات مستنية مراجعة"
            cta="راجعها"
          />
          <QueueAlert
            to="/dashboard/verifications"
            icon={ScanFace}
            count={s.queues.pendingVerifications}
            label="طلبات توثيق مستنية"
            cta="راجعها"
          />
        </div>
      )}

      {/* Headline KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label="المستخدمين"
          value={ar(s.users.total)}
          sub={`+${ar(s.users.new7d)} آخر ٧ أيام`}
        />
        <Kpi
          icon={Home}
          label="الإعلانات"
          value={ar(s.listings.total)}
          sub={`${ar(s.listings.published)} منشورة`}
        />
        <Kpi
          icon={BedDouble}
          label="سراير فاضية"
          value={ar(s.inventory.availableBeds)}
          sub={`من ${ar(s.inventory.totalBeds)} سرير`}
        />
        <Kpi
          icon={Inbox}
          label="طلبات المعاينة"
          value={ar(s.engagement.leads)}
          sub={`${ar(s.engagement.leadsPending)} مستنية`}
        />
      </div>

      {/* Breakdown panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Users */}
        <Panel title="المستخدمين" icon={Users}>
          <Row label="ساكنين" value={ar(s.users.renters)} />
          <Row label="ملّاك" value={ar(s.users.owners)} />
          <Row label="الاتنين" value={ar(s.users.both)} />
          <Row label="موثّقين" value={ar(s.users.verified)} accent="trust" />
          <Row label="مستنيين توثيق" value={ar(s.users.pendingVerification)} accent="amber" />
          <Row label="أدمن" value={ar(s.users.admins)} />
          <Row label="جداد (٣٠ يوم)" value={ar(s.users.new30d)} />
        </Panel>

        {/* Listings */}
        <Panel title="الإعلانات" icon={Home}>
          <Row label="منشورة" value={ar(s.listings.published)} accent="trust" />
          <Row label="مستنية مراجعة" value={ar(s.listings.pending)} accent="amber" />
          <Row label="مسودّات" value={ar(s.listings.draft)} />
          <Row label="مرفوضة" value={ar(s.listings.rejected)} accent="red" />
          <div className="my-2 border-t border-border" />
          <Row label="شقق" value={ar(s.listings.byType["شقة"])} />
          <Row label="أوض" value={ar(s.listings.byType["أوضة"])} />
          <Row label="سراير" value={ar(s.listings.byType["سرير"])} />
        </Panel>

        {/* Engagement + trust */}
        <Panel title="النشاط والثقة" icon={TrendingUp}>
          <Row icon={CheckCircle2} label="سكنات مؤكّدة" value={ar(s.engagement.tenancies)} />
          <Row icon={Star} label="تقييمات" value={ar(s.engagement.reviews)} />
          <Row icon={MessageSquare} label="محادثات" value={ar(s.engagement.threads)} />
          <Row icon={Bell} label="بحوث محفوظة" value={ar(s.engagement.savedSearches)} />
          <div className="my-2 border-t border-border" />
          <Row
            label="متوسط ثقة الإعلانات"
            value={s.trust.avgListingTrust?.toLocaleString("ar-EG") ?? "—"}
            accent="trust"
          />
          <Row
            label="متوسط ثقة الملّاك"
            value={s.trust.avgOwnerTrust?.toLocaleString("ar-EG") ?? "—"}
            accent="trust"
          />
        </Panel>
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentUsers users={s.recent.users} />
        <RecentListings listings={s.recent.listings} />
      </div>
    </div>
  );
}

function QueueAlert({
  to,
  icon: Icon,
  count,
  label,
  cta,
}: {
  to: "/dashboard/moderation" | "/dashboard/verifications";
  icon: typeof ShieldAlert;
  count: number;
  label: string;
  cta: string;
}) {
  if (!count) return null;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold leading-tight">
          {count.toLocaleString("ar-EG-u-nu-latn")} {label}
        </p>
        <p className="text-xs text-primary">{cta} ←</p>
      </div>
    </Link>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub ? <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 inline-flex items-center gap-2 font-display text-base font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h3>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: typeof Users;
  accent?: "trust" | "amber" | "red";
}) {
  const valueClass =
    accent === "trust"
      ? "text-trust"
      : accent === "amber"
        ? "text-amber-600"
        : accent === "red"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className={`font-medium tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function RecentUsers({ users }: { users: PlatformStats["recent"]["users"] }) {
  const roleLabel: Record<string, string> = { renter: "ساكن", owner: "مالك", both: "الاتنين" };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 font-display text-base font-semibold">آخر المستخدمين</h3>
      <ul className="divide-y divide-border">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="font-medium">{u.name}</span>
              {u.verified ? <ShieldCheck className="h-3.5 w-3.5 text-trust" /> : null}
            </span>
            <span className="text-xs text-muted-foreground">
              {roleLabel[u.role] ?? u.role} · {formatDate(u.createdAt)}
            </span>
          </li>
        ))}
        {users.length === 0 ? <li className="py-2 text-sm text-muted-foreground">مفيش</li> : null}
      </ul>
    </div>
  );
}

function RecentListings({ listings }: { listings: PlatformStats["recent"]["listings"] }) {
  const statusLabel: Record<string, string> = {
    published: "منشورة",
    pending_approval: "مستنية",
    draft: "مسودّة",
    rejected: "مرفوضة",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 font-display text-base font-semibold">آخر الإعلانات</h3>
      <ul className="divide-y divide-border">
        {listings.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <Link
              to="/property/$id"
              params={{ id: p.id }}
              className="min-w-0 flex-1 truncate font-medium hover:text-primary hover:underline"
            >
              {p.title}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground">
              {p.type} · {statusLabel[p.status] ?? p.status}
            </span>
          </li>
        ))}
        {listings.length === 0 ? (
          <li className="py-2 text-sm text-muted-foreground">مفيش</li>
        ) : null}
      </ul>
    </div>
  );
}
