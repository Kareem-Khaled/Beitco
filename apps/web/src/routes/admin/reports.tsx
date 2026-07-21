import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Flag,
  Home,
  Users,
  Star,
  MessageCircleQuestion,
  Check,
  X,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useAdminReports, adminUpdateReport } from "@/lib/beitoon/queries";
import { useAuth } from "@/lib/beitoon/auth";
import { formatDate } from "@/lib/beitoon/store";
import type { AdminReport, ReportTargetType } from "@/lib/beitoon/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

const STATUS_FILTERS = [
  { id: undefined, label: "اللي محتاج مراجعة" },
  { id: "open", label: "جديدة" },
  { id: "reviewing", label: "بنراجعها" },
  { id: "resolved", label: "اتحلّت" },
  { id: "dismissed", label: "اترفضت" },
] as const;

const TARGET_ICON: Record<ReportTargetType, typeof Home> = {
  listing: Home,
  review: Star,
  user: Users,
  question: MessageCircleQuestion,
};

const TARGET_LABEL: Record<ReportTargetType, string> = {
  listing: "إعلان",
  review: "تقييم",
  user: "مستخدم",
  question: "سؤال",
};

function AdminReports() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const {
    items: reports,
    isLoading,
    hasMore,
    fetchMore,
    isFetchingMore,
  } = useAdminReports({ status });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">البلاغات</h1>
        <p className="text-sm text-muted-foreground">راجع اللي بلّغ عنه الناس وتصرّف.</p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((o) => {
          const active = status === o.id;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => setStatus(o.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">بنحمّل…</p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Flag className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">مفيش بلاغات هنا 🎉</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMore()}
                disabled={isFetchingMore}
              >
                {isFetchingMore ? "بنحمّل…" : "شوف المزيد"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ReportCard({ report: r }: { report: AdminReport }) {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const Icon = TARGET_ICON[r.targetType];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adminReports"] });
    qc.invalidateQueries({ queryKey: ["reportsCount"] });
  };

  const act = async (status: string, ok: string) => {
    if (!me) return;
    setBusy(true);
    try {
      await adminUpdateReport(me.id, r.id, status);
      toast.success(ok);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  };

  // Deep-link to the right admin surface so the operator can act on the target.
  const targetLink =
    r.targetType === "listing"
      ? { to: "/admin/listings" as const }
      : r.targetType === "user"
        ? { to: "/admin/users" as const }
        : null;

  const resolved = r.status === "resolved" || r.status === "dismissed";

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              {r.reason}
            </span>
            <span className="text-xs text-muted-foreground">
              {TARGET_LABEL[r.targetType]}
              {r.targetLabel ? ` · ${r.targetLabel}` : ""}
            </span>
            <StatusPill status={r.status} />
          </div>
          {r.details ? <p className="mt-1.5 text-sm">{r.details}</p> : null}
          <p className="mt-1 text-xs text-muted-foreground">
            من {r.reporterName ?? "مستخدم"} · {formatDate(r.createdAt)}
          </p>
          {r.resolution ? <p className="mt-1 text-xs text-trust">القرار: {r.resolution}</p> : null}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {targetLink ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link {...targetLink}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  افتح {TARGET_LABEL[r.targetType]}
                </Link>
              </Button>
            ) : null}
            {!resolved ? (
              <>
                {r.status !== "reviewing" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => act("reviewing", "بنراجعه دلوقتي")}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    بنراجعه
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-trust"
                  disabled={busy}
                  onClick={() => act("resolved", "اتحلّ")}
                >
                  <Check className="h-3.5 w-3.5" />
                  اتحلّ
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  disabled={busy}
                  onClick={() => act("dismissed", "اترفض")}
                >
                  <X className="h-3.5 w-3.5" />
                  ارفض
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: "جديد", cls: "bg-amber-500/10 text-amber-600" },
    reviewing: { label: "بنراجعه", cls: "bg-primary/10 text-primary" },
    resolved: { label: "اتحلّ", cls: "bg-trust/10 text-trust" },
    dismissed: { label: "اترفض", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? map.open;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
  );
}

export type { AdminReport };
