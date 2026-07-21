import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Calendar, BedDouble, DoorOpen, Star, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/beitoon/auth";
import {
  useOwnerLeads,
  useOwnerProperties,
  setLeadStatus,
  submitRenterReview,
  renterReputationOf,
  ownerCanReview,
} from "@/lib/beitoon/queries";
import type { Lead } from "@/lib/beitoon/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RenterReviewDialog } from "@/components/beitoon/RenterReviewDialog";

export const Route = createFileRoute("/dashboard/leads")({
  component: DashboardLeads,
});

function DashboardLeads() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Lead["status"] | "all">("pending");
  const [reviewing, setReviewing] = useState<{ renterId: string; renterName: string } | null>(null);
  const { data: rawLeads = [] } = useOwnerLeads(user?.id);
  const { data: properties = [] } = useOwnerProperties(user?.id);

  const allLeads = useMemo(
    () => [...rawLeads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [rawLeads],
  );

  if (!user) return null;
  const leads = tab === "all" ? allLeads : allLeads.filter((l) => l.status === tab);

  const tabs: { id: Lead["status"] | "all"; label: string }[] = [
    { id: "pending", label: "معلّقة" },
    { id: "approved", label: "اتقبلت" },
    { id: "declined", label: "اترفضت" },
    { id: "completed", label: "خلصت" },
    { id: "all", label: "الكل" },
  ];

  const counts = {
    pending: allLeads.filter((l) => l.status === "pending").length,
    approved: allLeads.filter((l) => l.status === "approved").length,
    declined: allLeads.filter((l) => l.status === "declined").length,
    completed: allLeads.filter((l) => l.status === "completed").length,
    all: allLeads.length,
  };

  const refreshLeads = () => qc.invalidateQueries({ queryKey: ["ownerLeads", user.id] });

  const act = async (id: string, status: Lead["status"]) => {
    await setLeadStatus(id, status);
    const msg =
      status === "approved" ? "قبلت الطلب" : status === "declined" ? "رفضت الطلب" : "خلص الطلب";
    toast.success(msg);
    refreshLeads();
  };

  const onSubmitRenterReview = async (data: {
    rating: number;
    body: string;
    scores: { reliability: number; cleanliness: number; communication: number };
  }) => {
    if (!reviewing) return;
    try {
      await submitRenterReview(user.id, reviewing.renterId, data);
      toast.success("اتنشر تقييمك للساكن");
    } catch {
      toast.error("مش قادرين نسجّل التقييم دلوقتي");
    }
    setReviewing(null);
    refreshLeads();
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">طلبات المعاينة</h1>
        <p className="text-sm text-muted-foreground">رد على المستأجرين اللي عايزين يشوفوا شققك.</p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="ms-1 text-[11px] opacity-70">
              ({counts[t.id].toLocaleString("ar-EG-u-nu-latn")})
            </span>
          </button>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          ولا طلب هنا.
        </div>
      ) : (
        <ul className="grid gap-3">
          {leads.map((l) => {
            const p = properties.find((pp) => pp.id === l.propertyId);
            return (
              <li key={l.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-semibold">{l.renterName}</p>
                      <RenterReputation lead={l} />
                      <StatusPill status={l.status} />
                      {l.intent === "booking" ? (
                        <span className="rounded-full bg-trust px-2 py-0.5 text-[11px] font-medium text-trust-foreground">
                          طلب حجز
                        </span>
                      ) : null}
                    </div>
                    {/* The specific unit(s) they want  -  the heart of bed-level booking */}
                    {l.units && l.units.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {l.units.map((u, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-trust/30 bg-trust-soft px-2.5 py-1 text-xs font-medium"
                          >
                            {u.kind === "room" ? (
                              <DoorOpen className="h-3.5 w-3.5 text-trust" />
                            ) : (
                              <BedDouble className="h-3.5 w-3.5 text-trust" />
                            )}
                            {u.kind === "bed" && u.roomName
                              ? `${u.roomName} · ${u.label}`
                              : u.label}
                          </span>
                        ))}
                        {l.units.length > 1 && (
                          <span className="text-[11px] text-muted-foreground">
                            · إجمالي{" "}
                            {l.units
                              .reduce((s, u) => s + (u.price ?? 0), 0)
                              .toLocaleString("ar-EG-u-nu-latn")}{" "}
                            ج.م/شهر
                          </span>
                        )}
                      </div>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      على شقة:{" "}
                      {p ? (
                        <Link
                          to="/property/$id"
                          params={{ id: p.id }}
                          className="text-primary hover:underline"
                        >
                          {p.title}
                        </Link>
                      ) : (
                        " - "
                      )}
                    </p>
                    {l.preferredDate ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        ميعاد مقترح:{" "}
                        {new Date(l.preferredDate).toLocaleDateString("ar-EG-u-nu-latn")}
                      </p>
                    ) : null}
                    {l.note ? (
                      <p className="mt-2 rounded-lg bg-surface p-2 text-sm">{l.note}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {l.status === "pending" ? (
                      <>
                        <Button size="sm" onClick={() => act(l.id, "approved")}>
                          <Check className="me-1 h-4 w-4" />
                          اقبل
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => act(l.id, "declined")}>
                          <X className="me-1 h-4 w-4" />
                          ارفض
                        </Button>
                      </>
                    ) : null}
                    {l.status === "approved" ? (
                      <Button size="sm" variant="outline" onClick={() => act(l.id, "completed")}>
                        خلصت
                      </Button>
                    ) : null}
                    {l.status === "completed" && ownerCanReview(user.id, l) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setReviewing({ renterId: l.renterId, renterName: l.renterName })
                        }
                      >
                        <Star className="me-1 h-4 w-4" />
                        قيّم الساكن
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  جالك من {new Date(l.createdAt).toLocaleDateString("ar-EG-u-nu-latn")}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <RenterReviewDialog
        open={reviewing !== null}
        onOpenChange={(v) => !v && setReviewing(null)}
        renterName={reviewing?.renterName ?? ""}
        onSubmit={onSubmitRenterReview}
      />
    </div>
  );
}

// Privacy-safe reputation badge: shows the renter's aggregate score + review
// count to the owner, never the underlying review text (TRUST_SPEC §6).
function RenterReputation({ lead }: { lead: Lead }) {
  const rep = renterReputationOf(lead);
  if (!rep) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
        ساكن جديد
      </span>
    );
  }
  const good = rep.score >= 7.5;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        good ? "bg-trust-soft text-trust" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      }`}
      title={`تقييم الساكن من ${rep.count.toLocaleString("ar-EG-u-nu-latn")} ملّاك`}
    >
      <ShieldCheck className="h-3 w-3" />
      سمعة {rep.score.toFixed(1)}
    </span>
  );
}

function StatusPill({ status }: { status: Lead["status"] }) {
  const map: Record<Lead["status"], { tone: string; label: string }> = {
    pending: { tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "معلّق" },
    approved: { tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "اتقبل" },
    declined: { tone: "bg-red-500/10 text-red-600 dark:text-red-400", label: "اترفض" },
    completed: { tone: "bg-muted text-muted-foreground", label: "خلص" },
  };
  const s = map[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.tone}`}>{s.label}</span>
  );
}
