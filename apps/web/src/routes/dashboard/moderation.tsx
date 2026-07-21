import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Check, X, MapPin, ExternalLink, BedDouble } from "lucide-react";
import { useAuth } from "@/lib/beitoon/auth";
import { isPlatformAdmin, formatDate } from "@/lib/beitoon/store";
import { usePendingListings, approveListing, rejectListing } from "@/lib/beitoon/queries";
import type { Property } from "@/lib/beitoon/types";
import { EmptyState } from "@/components/beitoon/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/moderation")({
  component: ModerationQueue,
});

// Common rejection reasons  -  one tap instead of typing.
const QUICK_REASONS = [
  "الصور مش واضحة أو مش حقيقية",
  "السعر مش منطقي أو ناقص",
  "بيانات ناقصة عن المكان",
  "مكرر  -  نفس الإعلان متحط قبل كده",
  "مخالف لشروط النشر",
];

function ModerationQueue() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<Property | null>(null);
  const [reason, setReason] = useState("");
  const { data: pending = [] } = usePendingListings();

  // Admin-only: bounce everyone else.
  useEffect(() => {
    if (!isLoading && !isPlatformAdmin(user)) {
      navigate({ to: "/dashboard" });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;
  if (!isPlatformAdmin(user)) return null;

  const refreshQueue = () => {
    qc.invalidateQueries({ queryKey: ["pendingListings"] });
    qc.invalidateQueries({ queryKey: ["moderationCount"] });
  };

  const onApprove = async (p: Property) => {
    await approveListing(p.id);
    toast.success(`وافقنا على «${p.title}»  -  بقت شغّالة`);
    refreshQueue();
  };

  const openReject = (p: Property) => {
    setReason("");
    setRejecting(p);
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    await rejectListing(rejecting.id, reason);
    toast.success(`رفضنا «${rejecting.title}»`);
    setRejecting(null);
    setReason("");
    refreshQueue();
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-trust-soft text-trust">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">مراجعة الإعلانات</h1>
          <p className="text-sm text-muted-foreground">
            راجع إعلانات الملّاك غير الموثّقين قبل ما تظهر للناس.
          </p>
        </div>
      </header>

      {pending.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="مفيش حاجة مستنية مراجعة"
          hint="كل الإعلانات الجديدة اتراجعت. هتلاقي أي إعلان جديد من صاحب غير موثّق هنا."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {pending.length.toLocaleString("ar-EG-u-nu-latn")}
            </span>{" "}
            إعلان مستني المراجعة
          </p>
          <ul className="grid gap-4">
            {pending.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex flex-col gap-4 p-4 sm:flex-row">
                  {/* Preview image */}
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        بدون صور
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold">{p.title}</h3>
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        مستني المراجعة
                      </span>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.address || p.area}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        صاحبه: <span className="text-foreground">{p.landlord.name}</span>{" "}
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                          غير موثّق
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3 w-3" />
                        {p.type}
                      </span>
                      <span className="font-medium tabular-nums text-foreground">
                        {(p.priceFrom ?? p.price).toLocaleString("ar-EG-u-nu-latn")} ج.م
                      </span>
                      <span>اتبعت {formatDate(p.createdAt)}</span>
                    </div>
                    {p.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => onApprove(p)}>
                        <Check className="me-1 h-4 w-4" />
                        وافق وانشر
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openReject(p)}>
                        <X className="me-1 h-4 w-4" />
                        ارفض
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/property/$id" params={{ id: p.id }} target="_blank">
                          <ExternalLink className="me-1 h-4 w-4" />
                          عاين الإعلان
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Reject reason dialog */}
      <Dialog open={rejecting !== null} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">سبب الرفض</DialogTitle>
            <DialogDescription>
              هنوضّح لصاحب الإعلان «{rejecting?.title}» السبب عشان يقدر يصلّحه ويبعته تاني.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5 py-1">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  reason === r
                    ? "border-trust bg-trust-soft text-trust"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="اكتب السبب بالتفصيل…"
            rows={3}
            className="resize-none"
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              إلغاء
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmReject}
              disabled={!reason.trim()}
            >
              ارفض الإعلان
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
