import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { KeyRound, Star, Search, BadgeCheck, Check, X } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import {
  getTenanciesForUser,
  getProperty,
  canUserReview,
  getPendingOccupantLinks,
  resolveOccupantLink,
} from "@/lib/beitco/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/me/tenancies")({
  component: MeTenancies,
});

function MeTenancies() {
  const { user } = useAuth();
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  const tenancies = useMemo(() => {
    if (!user) return [];
    return getTenanciesForUser(user.id).sort(
      (a, b) => +new Date(b.moveInDate) - +new Date(a.moveInDate),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, force]);

  const pendingLinks = useMemo(
    () => (user ? getPendingOccupantLinks(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, force],
  );

  if (!user) return null;

  const resolve = (link: (typeof pendingLinks)[number], action: "confirm" | "decline") => {
    resolveOccupantLink(user.id, link, action);
    toast.success(action === "confirm" ? "أكّدت إنك ساكن هنا" : "اترفض الطلب");
    refresh();
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">سكني</h1>
        <p className="text-sm text-muted-foreground">
          الأماكن اللي سكنت فيها. بعد 30 يوم تقدر تكتب رأيك وتساعد غيرك.
        </p>
      </header>

      {/* Pending link requests — owner asked to register you as a resident */}
      {pendingLinks.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BadgeCheck className="h-4 w-4 text-amber-600" />
            طلبات تأكيد سكن
          </div>
          <p className="text-xs text-muted-foreground">
            صاحب شقة سجّلك ساكن عنده. أكّد بس لو ده صح — التأكيد بيخليك تقدر تكتب رأيك بعد 30 يوم.
          </p>
          <ul className="space-y-2">
            {pendingLinks.map((link, i) => (
              <li
                key={`${link.propertyId}-${i}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {link.unitLabel} · {link.propertyTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">من {link.ownerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1" onClick={() => resolve(link, "confirm")}>
                    <Check className="h-3.5 w-3.5" />
                    أكّد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => resolve(link, "decline")}
                  >
                    <X className="h-3.5 w-3.5" />
                    مش أنا
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tenancies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <KeyRound className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">لسه ما سكنتش في أي مكان من خلال بيتكو.</p>
          <Button asChild className="mt-4">
            <Link to="/search">
              <Search className="me-1 h-4 w-4" />
              دوّر على بيت
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {tenancies.map((t) => {
            const p = getProperty(t.propertyId);
            const current = !t.moveOutDate;
            const canReview = canUserReview(user.id, t.propertyId);
            return (
              <li key={t.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start gap-4">
                  {p?.image ? (
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {p ? (
                        <Link
                          to="/property/$id"
                          params={{ id: p.id }}
                          className="font-display text-base font-semibold hover:underline"
                        >
                          {p.title}
                        </Link>
                      ) : (
                        <span className="font-display text-base font-semibold">—</span>
                      )}
                      {current ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          ساكن دلوقتي
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          سكنت قبل كده
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      دخلت {new Date(t.moveInDate).toLocaleDateString("ar-EG-u-nu-latn")}
                      {t.moveOutDate
                        ? ` · خرجت ${new Date(t.moveOutDate).toLocaleDateString("ar-EG-u-nu-latn")}`
                        : ` · قاعد ${t.monthsLived} شهر`}
                    </p>
                  </div>

                  {p ? (
                    canReview ? (
                      <Button asChild size="sm" className="gap-1.5">
                        <Link to="/property/$id" params={{ id: p.id }}>
                          <Star className="h-4 w-4" />
                          اكتب رأيك
                        </Link>
                      </Button>
                    ) : (
                      <span className="self-center text-[11px] text-muted-foreground">
                        تقدر تقيّم بعد 30 يوم
                      </span>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
