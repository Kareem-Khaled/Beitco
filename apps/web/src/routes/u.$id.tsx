import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ShieldCheck, Star, Home, MessageCircle, CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { TrustBadgeExplained } from "@/components/beitco/TrustBadgeExplained";
import { BeitcoListingCard } from "@/components/beitco/BeitcoListingCard";
import { getPublicProfile, formatDate } from "@/lib/beitco/store";

export const Route = createFileRoute("/u/$id")({
  loader: ({ params }) => {
    const profile = getPublicProfile(params.id);
    if (!profile) throw notFound();
    return profile;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "حساب"} — بيتكو` },
      { name: "description", content: "ملف عام على بيتكو — إعلانات وآراء حقيقية." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = Route.useLoaderData();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header card */}
        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-xl font-semibold text-accent-foreground">
              {profile.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold">{profile.name}</h1>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2 py-0.5 text-xs font-medium text-trust-foreground">
                    <ShieldCheck className="h-3 w-3" /> موثّق
                  </span>
                )}
              </div>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                عضو من {formatDate(profile.memberSince)}
              </p>
            </div>
            <TrustBadgeExplained
              score={profile.trust}
              verified={profile.verified}
              reviewsCount={profile.totalReviews}
              responseRate={profile.responseRate}
              breakdown={profile.trustBreakdown}
            />
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Home} label="إعلانات" value={profile.listings.length.toLocaleString("ar-EG-u-nu-latn")} />
            <Stat icon={Star} label="آراء" value={profile.totalReviews.toLocaleString("ar-EG-u-nu-latn")} />
            <Stat
              icon={Star}
              label="متوسط التقييم"
              value={profile.avgRating ? profile.avgRating.toFixed(1) : "—"}
            />
            <Stat
              icon={MessageCircle}
              label="بيرد بسرعة"
              value={profile.responseRate != null ? `${profile.responseRate}%` : "—"}
            />
          </div>
        </section>

        {/* Listings */}
        {profile.isOwner && (
          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold">
              إعلاناته ({profile.listings.length.toLocaleString("ar-EG-u-nu-latn")})
            </h2>
            {profile.listings.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">مفيش إعلانات منشورة دلوقتي.</p>
            ) : (
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {profile.listings.map((p) => (
                  <BeitcoListingCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Reviews received */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">
            آراء الساكنين ({profile.totalReviews.toLocaleString("ar-EG-u-nu-latn")})
          </h2>
          {profile.reviews.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              لسه مفيش آراء.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {profile.reviews.map(({ review, property }) => (
                <article key={review.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {review.initials}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{review.author}</div>
                        <div className="text-[11px] text-muted-foreground">
                          سكن {review.monthsLived.toLocaleString("ar-EG-u-nu-latn")} شهر · {review.date}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
                  <Link
                    to="/property/$id"
                    params={{ id: property.id }}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    {property.title}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
