import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Heart, Inbox, KeyRound, Search, Sparkles, SlidersHorizontal, LayoutDashboard, Home, Bookmark, Trash2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import {
  getSavedForUser,
  getLeadsForRenter,
  getTenanciesForUser,
  getMatchesForUser,
  getPropertiesByOwner,
  profileCompleteness,
  getSavedSearches,
  deleteSavedSearch,
  getRenterReputation,
} from "@/lib/beitco/store";
import type { SavedSearch } from "@/lib/beitco/types";
import { MatchBadge } from "@/components/beitco/MatchBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/me/")({
  component: MeOverview,
});

function MeOverview() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "both";
  const data = useMemo(() => {
    if (!user)
      return { saved: 0, pending: 0, tenancies: 0, completeness: 0, topMatch: 0, matchCount: 0, listings: 0, reputation: undefined as { score: number; count: number } | undefined };
    const matches = getMatchesForUser(user.id);
    return {
      saved: getSavedForUser(user.id).length,
      pending: getLeadsForRenter(user.id).filter((l) => l.status === "pending").length,
      tenancies: getTenanciesForUser(user.id).length,
      completeness: profileCompleteness(user.profile),
      topMatch: matches[0]?.match.score ?? 0,
      matchCount: matches.length,
      listings: getPropertiesByOwner(user.id).length,
      reputation: getRenterReputation(user.id),
    };
  }, [user]);

  // Saved searches (FE-6) — local list so deletes re-render immediately.
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  useEffect(() => {
    setSavedSearches(user ? getSavedSearches(user.id) : []);
  }, [user]);
  const removeSearch = (id: string) => {
    if (!user) return;
    deleteSavedSearch(user.id, id);
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  if (!user) return null;
  // Pure owners (no renter intent) shouldn't see the renter matching hero.
  const showRenterHero = user.role !== "owner";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">حسابي</h1>
        <p className="text-sm text-muted-foreground">
          أهلاً يا {user.name.split(" ")[0]} — ده ملخص نشاطك على بيتكو.
        </p>
      </header>

      {/* Renter reputation (two-sided trust, T-4) */}
      {data.reputation && (
        <section className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                data.reputation.score >= 7.5 ? "bg-trust-soft text-trust" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold tabular-nums">
                  {data.reputation.score.toFixed(1)}
                </span>
                <h3 className="text-sm font-medium text-muted-foreground">سمعتك كساكن</h3>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                من تقييم {data.reputation.count.toLocaleString("ar-EG-u-nu-latn")} من الملّاك اللي سكنت عندهم — بتساعدك توصل لبيتك الجاي أسرع.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Owner card — go to your dashboard */}
      {isOwner && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-trust-soft text-trust">
              <Home className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold">
                {data.listings > 0
                  ? `عندك ${data.listings.toLocaleString("ar-EG-u-nu-latn")} ${data.listings === 1 ? "إعلان" : "إعلانات"}`
                  : "ابدأ أأجّر مكانك"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {data.listings > 0
                  ? "تابع شققك، طلبات المعاينة، والآراء من لوحتك."
                  : "حط أول إعلان وابدأ توصل لمستأجرين موثوقين."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="me-1 h-4 w-4" />
                روح للوحتك
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/list/new">حط شقة</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Matching hero — renters only */}
      {showRenterHero &&
        (data.completeness >= 30 ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-trust/30 bg-trust-soft/50 p-5">
          <div className="flex items-center gap-4">
            <MatchBadge score={data.topMatch} />
            <div>
              <h3 className="font-display text-base font-semibold">
                لاقينالك {data.matchCount.toLocaleString("ar-EG-u-nu-latn")} مكان يناسبك
              </h3>
              <p className="text-xs text-muted-foreground">
                أعلى تطابق {data.topMatch}% حسب تفضيلاتك الحالية.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/me/matches">
              <Sparkles className="me-1 h-4 w-4" />
              شوف اللي يناسبك
            </Link>
          </Button>
        </section>
      ) : (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h3 className="font-display text-base font-semibold">كمّل ملفك عشان نلاقيلك بيتك</h3>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              قولنا ميزانيتك ومناطقك واللي بتدوّر عليه — وهنرتّبلك الأماكن اللي تناسبك بالظبط.
            </p>
            <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-trust transition-all"
                style={{ width: `${data.completeness}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              اكتمل {data.completeness}% من ملفك
            </p>
          </div>
          <Button asChild>
            <Link to="/me/preferences">
              <SlidersHorizontal className="me-1 h-4 w-4" />
              حدّد تفضيلاتك
            </Link>
          </Button>
        </section>
        ))}

      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/me/saved"
          className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Heart className="h-4 w-4" />
            المحفوظات
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
            {data.saved.toLocaleString("ar-EG-u-nu-latn")}
          </p>
        </Link>
        <Link
          to="/me/applications"
          className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Inbox className="h-4 w-4" />
            طلبات معاينة معلّقة
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
            {data.pending.toLocaleString("ar-EG-u-nu-latn")}
          </p>
        </Link>
        <Link
          to="/me/tenancies"
          className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-4 w-4" />
            أماكن سكنت فيها
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
            {data.tenancies.toLocaleString("ar-EG-u-nu-latn")}
          </p>
        </Link>
      </section>

      {/* Saved searches (FE-6) */}
      {savedSearches.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-trust-soft text-trust">
              <Bookmark className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold">عمليات البحث المحفوظة</h2>
              <p className="text-xs text-muted-foreground">ارجع لأي بحث بضغطة — وقريّب هنبعتلك لما ينزل مكان جديد يطابقه.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {savedSearches.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <Link
                  to="/search"
                  search={s.params}
                  className="flex min-w-0 flex-1 items-center gap-2 text-sm hover:text-trust"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{s.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeSearch(s.id)}
                  aria-label={`احذف ${s.label}`}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <h3 className="font-display text-lg font-semibold">لسه بتدوّر على بيت؟</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          فيه أماكن جديدة بتتحط كل يوم. دوّر باللي يناسبك ولاقي سريرك.
        </p>
        <Button asChild className="mt-4">
          <Link to="/search">
            <Search className="me-1 h-4 w-4" />
            دوّر دلوقتي
          </Link>
        </Button>
      </section>
    </div>
  );
}
