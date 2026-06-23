import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, SlidersHorizontal, Check, X, SearchX } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { profileCompleteness } from "@/lib/beitco/store";
import { useMatches } from "@/lib/beitco/queries";
import { BeitcoListingCard } from "@/components/beitco/BeitcoListingCard";
import { MatchBadge } from "@/components/beitco/MatchBadge";
import { EmptyState } from "@/components/beitco/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/me/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const { user } = useAuth();
  const { data: matches = [] } = useMatches(user?.id);
  const hasProfile = !!user?.profile && profileCompleteness(user.profile) > 0;

  if (!user) return null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">اللي يناسبك</h1>
          <p className="text-sm text-muted-foreground">
            أماكن رتّبناها حسب تفضيلاتك — الأعلى تطابق الأول.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/me/preferences">
            <SlidersHorizontal className="me-1 h-4 w-4" />
            عدّل تفضيلاتك
          </Link>
        </Button>
      </header>

      {!hasProfile ? (
        <EmptyState
          icon={Sparkles}
          title="عرّفنا بنفسك الأول"
          hint="لما تقولنا ميزانيتك ومناطقك واللي بتدوّر عليه، هنرتّبلك الأماكن اللي تناسبك بالظبط."
          action={
            <Button asChild>
              <Link to="/me/preferences">حدّد تفضيلاتك</Link>
            </Button>
          }
        />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="مفيش أماكن تناسبك دلوقتي"
          hint="جرّب توسّع شوية في تفضيلاتك أو راجع ميزانيتك ومناطقك."
          action={
            <Button asChild variant="outline">
              <Link to="/me/preferences">عدّل تفضيلاتك</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {matches.map(({ property, match }) => (
            <div
              key={property.id}
              className="rounded-2xl border border-border bg-card p-3 sm:p-4"
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
                {/* Match summary */}
                <div className="order-2 flex flex-col sm:order-1">
                  <div className="flex items-center gap-3">
                    <MatchBadge score={match.score} />
                    <div>
                      <div className="font-display text-lg font-semibold">
                        {match.score}% يناسبك
                      </div>
                      <Link
                        to="/property/$id"
                        params={{ id: property.id }}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {property.title}
                      </Link>
                    </div>
                  </div>

                  {match.reasons.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {match.reasons.map((r) => (
                        <li
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
                        >
                          <Check className="h-3 w-3" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}

                  {match.misses.length > 0 && (
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {match.misses.map((m) => (
                        <li
                          key={m}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          <X className="h-3 w-3" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Listing card */}
                <div className="order-1 sm:order-2">
                  <BeitcoListingCard p={property} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
