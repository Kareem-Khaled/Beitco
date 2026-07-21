import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X, Star, Trash2, RotateCcw, ExternalLink, ThumbsUp } from "lucide-react";
import { useAdminReviews, adminRemoveReview, adminRestoreReview } from "@/lib/beitoon/queries";
import { formatDate } from "@/lib/beitoon/store";
import type { AdminReviewRow } from "@/lib/beitoon/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

const FILTERS = [
  { id: "false", label: "الشغّالة" },
  { id: undefined, label: "الكل" },
  { id: "true", label: "المحذوفة" },
] as const;

function AdminReviews() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [removed, setRemoved] = useState<string | undefined>("false");
  const { data: reviews = [], isLoading } = useAdminReviews({ q: search || undefined, removed });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">التقييمات</h1>
        <p className="text-sm text-muted-foreground">
          شيل التقييمات المزيّفة أو المسيئة  -  درجة الثقة بتتحسب من جديد على طول.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
        className="flex items-center gap-2 rounded-xl border border-border bg-card p-2"
      >
        <Search className="ms-1 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="دوّر في نص التقييم أو اسم صاحبه…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setSearch("");
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="مسح"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <Button type="submit" size="sm" className="rounded-lg">
          دوّر
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((o) => {
          const active = removed === o.id;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => setRemoved(o.id)}
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
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          مفيش تقييمات هنا
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ review: r }: { review: AdminReviewRow }) {
  const qc = useQueryClient();
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adminReviews"] });
    qc.invalidateQueries({ queryKey: ["adminStats"] });
  };

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className={`rounded-2xl border p-4 ${
        r.removed ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums">
              <Star className="h-3.5 w-3.5 fill-trust text-trust" />
              {r.rating.toLocaleString("ar-EG")}
            </span>
            <span className="text-sm font-medium">{r.author}</span>
            {r.removed ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                محذوف
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm">{r.body}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {r.propertyTitle ? (
              <Link
                to="/property/$id"
                params={{ id: r.propertyId }}
                className="inline-flex items-center gap-1 hover:text-primary hover:underline"
              >
                {r.propertyTitle}
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
            <span>· {formatDate(r.createdAt)}</span>
            {r.helpful ? (
              <span className="inline-flex items-center gap-0.5">
                · <ThumbsUp className="h-3 w-3" /> {r.helpful.toLocaleString("ar-EG")}
              </span>
            ) : null}
          </div>
          {r.removedReason ? (
            <p className="mt-1 text-xs text-destructive">سبب الحذف: {r.removedReason}</p>
          ) : null}
        </div>

        <div className="shrink-0">
          {r.removed ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => run(() => adminRestoreReview(r.id), "رجع التقييم")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              رجّعه
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => {
                setReason("");
                setRemoving(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              احذفه
            </Button>
          )}
        </div>
      </div>

      <Dialog open={removing} onOpenChange={setRemoving}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف التقييم</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هيختفي التقييم من المكان، ودرجة الثقة هتتحسب من غيره على طول. الإجراء بيتسجّل.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثلاً: تقييم مزيّف من حساب وهمي"
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoving(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                setRemoving(false);
                run(() => adminRemoveReview(r.id, reason), "اتحذف التقييم");
              }}
            >
              احذفه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

export type { AdminReviewRow };
