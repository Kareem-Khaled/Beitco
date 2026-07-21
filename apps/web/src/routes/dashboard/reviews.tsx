import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/beitoon/auth";
import { useOwnerProperties } from "@/lib/beitoon/queries";

export const Route = createFileRoute("/dashboard/reviews")({
  component: DashboardReviews,
});

function DashboardReviews() {
  const { user } = useAuth();
  const { data: properties = [] } = useOwnerProperties(user?.id);
  const data = useMemo(() => {
    return properties
      .flatMap((p) => p.reviews.map((r) => ({ r, p })))
      .sort((a, b) => +new Date(b.r.date) - +new Date(a.r.date));
  }, [properties]);

  if (!user) return null;

  const avg = data.length ? data.reduce((s, x) => s + x.r.rating, 0) / data.length : 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">آراء الناس</h1>
          <p className="text-sm text-muted-foreground">كل اللي قاله الساكنين على شققك.</p>
        </div>
        {data.length ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-2 text-end">
            <p className="text-xs text-muted-foreground">متوسط التقييم</p>
            <p className="font-display text-xl font-semibold tabular-nums">
              <Star className="me-1 inline h-4 w-4 fill-amber-400 text-amber-400" />
              {avg.toFixed(1)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({data.length.toLocaleString("ar-EG-u-nu-latn")})
              </span>
            </p>
          </div>
        ) : null}
      </header>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          لسه ما حدش كتب رأيه. الآراء بتيجي بعد ما الناس تسكن 30 يوم.
        </div>
      ) : (
        <ul className="grid gap-3">
          {data.map(({ r, p }) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                  {r.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{r.author}</p>
                    <span className="text-xs text-muted-foreground">ساكن {r.monthsLived} شهر</span>
                    <span className="ms-auto inline-flex items-center gap-1 text-sm tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {r.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{r.body}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Link
                      to="/property/$id"
                      params={{ id: p.id }}
                      className="text-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                    <span>{r.date}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
