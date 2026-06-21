import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  MapPin, ShieldCheck, Star, Users, Wifi, Snowflake, WashingMachine,
  Microwave, Refrigerator, ArrowUpDown, Car, Lock, Sofa, Coffee,
  MessageCircle, Heart, Share2, ChevronLeft, BedDouble, CheckCircle2, HelpCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { TrustBadge } from "@/components/beitco/TrustBadge";
import { ScoreBar } from "@/components/beitco/ScoreBar";
import { Button } from "@/components/ui/button";
import { getProperty } from "@/lib/beitco/properties";

export const Route = createFileRoute("/property/$id")({
  loader: ({ params }) => {
    const property = getProperty(params.id);
    if (!property) throw notFound();
    return property;
  },
  head: () => ({
    meta: [
      { title: "Property — Beitco" },
      {
        name: "description",
        content: "Verified housing with real reviews and area intelligence on Beitco.",
      },
    ],
  }),
  component: PropertyPage,
});

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  WiFi: Wifi,
  "Air Conditioning": Snowflake,
  "Washing Machine": WashingMachine,
  Microwave: Microwave,
  Refrigerator: Refrigerator,
  Elevator: ArrowUpDown,
  "Covered Parking": Car,
  "24/7 Security": Lock,
  Furnished: Sofa,
  "Shared Kitchen": Coffee,
  "Weekly Cleaning": Sofa,
  Workspace: Sofa,
};

function iconFor(name: string) {
  const key = Object.keys(amenityIcons).find((k) => name.startsWith(k));
  return amenityIcons[key ?? ""] ?? CheckCircle2;
}

function PropertyPage() {
  const { id } = Route.useParams();
  const p = getProperty(id)!;
  const totalCost = p.costs.reduce((s, c) => s + c.amount, 0);
  const avgQuality =
    Object.values(p.quality).reduce((s, v) => s + v, 0) / Object.values(p.quality).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to discover
        </Link>

        {/* Title row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{p.type}</span>
              {p.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2 py-0.5 text-xs font-medium text-trust-foreground">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <TrustBadge score={p.trust} />
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{p.title}</h1>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.address}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5"><Share2 className="h-4 w-4" />Share</Button>
            <Button variant="ghost" size="sm" className="gap-1.5"><Heart className="h-4 w-4" />Save</Button>
          </div>
        </div>

        {/* Gallery */}
        <div className="mt-5 grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
          <img src={p.images[0]} alt="" className="col-span-4 row-span-2 aspect-[16/9] h-full w-full object-cover sm:col-span-2" width={1600} height={1200} />
          {p.images.slice(1, 4).map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              loading="lazy"
              className="hidden h-full w-full object-cover sm:block"
              width={800}
              height={600}
            />
          ))}
        </div>

        {/* Body */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-10">
            {/* Trust section */}
            <section className="rounded-3xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Trust & verification</h2>
                <TrustBadge score={p.trust} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat icon={ShieldCheck} label="Verification" value={p.verified ? "Verified" : "Pending"} tone={p.verified ? "trust" : "muted"} />
                <Stat icon={Star} label="Reviews" value={String(p.reviewsCount)} />
                <Stat icon={Users} label="Past residents" value={String(p.residents)} />
                <Stat icon={MessageCircle} label="Response rate" value={`${p.landlord.responseRate}%`} />
              </div>
            </section>

            {/* Housing quality */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">Housing quality</h2>
                <span className="text-sm text-muted-foreground">
                  Average <span className="font-semibold text-foreground">{avgQuality.toFixed(1)}</span> · scored by residents
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
                <ScoreBar label="Internet" value={p.quality.internet} />
                <ScoreBar label="Safety" value={p.quality.safety} />
                <ScoreBar label="Noise (quieter is better)" value={p.quality.noise} />
                <ScoreBar label="Maintenance" value={p.quality.maintenance} />
                <ScoreBar label="Cleanliness" value={p.quality.cleanliness} />
              </div>
            </section>

            {/* Description */}
            <section>
              <h2 className="font-display text-lg font-semibold">About this place</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{p.description}</p>
            </section>

            {/* Amenities */}
            <section>
              <h2 className="font-display text-lg font-semibold">Amenities</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.amenities.map((a) => {
                  const Icon = iconFor(a);
                  return (
                    <div key={a} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-trust-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm">{a}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Beds occupancy (if bed rental) */}
            {p.beds && (
              <section className="rounded-3xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold">Shared housing</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {p.beds.total - p.beds.occupied}/{p.beds.total} available
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {Array.from({ length: p.beds.total }).map((_, i) => {
                    const occupied = i < p.beds!.occupied;
                    return (
                      <div
                        key={i}
                        className={`flex aspect-square flex-col items-center justify-center rounded-xl border ${
                          occupied
                            ? "border-border bg-muted text-muted-foreground"
                            : "border-trust/40 bg-trust-soft text-primary"
                        }`}
                      >
                        <BedDouble className="h-5 w-5" />
                        <span className="mt-1 text-[10px] font-medium uppercase">
                          {occupied ? "Taken" : "Free"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-trust" />Available</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-border" />Occupied</span>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">Resident reviews</h2>
                <span className="text-sm text-muted-foreground">{p.reviewsCount} reviews</span>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {p.reviews.map((r) => (
                  <article key={r.id} className="rounded-2xl border border-border bg-surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {r.initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{r.author}</div>
                          <div className="text-xs text-muted-foreground">
                            Lived here {r.monthsLived} months · {r.date}
                          </div>
                        </div>
                      </div>
                      <TrustBadge score={r.rating} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* Q&A */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">Questions & answers</h2>
                <Button size="sm" variant="ghost" className="gap-1.5"><HelpCircle className="h-4 w-4" />Ask a question</Button>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {p.qa.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
                    No questions yet. Be the first to ask.
                  </div>
                )}
                {p.qa.map((q) => (
                  <article key={q.id} className="rounded-2xl border border-border bg-surface p-5">
                    <div className="text-sm font-medium">{q.q}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Asked by {q.asker} · {q.date}</div>
                    {q.a ? (
                      <div className="mt-3 rounded-xl bg-trust-soft p-3 text-sm">
                        <div className="text-xs font-semibold text-primary">{q.answerer}</div>
                        <p className="mt-1 text-foreground">{q.a}</p>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs italic text-muted-foreground">No answer yet</div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-display text-3xl font-semibold tabular-nums">
                    {p.price.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">EGP / month</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Base rent — see full breakdown below</div>
                </div>
                <TrustBadge score={p.trust} />
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button size="lg" className="w-full rounded-xl">Request to view</Button>
                <Button size="lg" variant="outline" className="w-full rounded-xl gap-2">
                  <MessageCircle className="h-4 w-4" /> Message landlord
                </Button>
              </div>

              {/* Cost breakdown */}
              <div className="mt-6 border-t border-border pt-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monthly cost breakdown
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {p.costs.map((c) => (
                    <li key={c.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{c.label}</span>
                      <span className="tabular-nums">
                        {c.amount === 0 ? "Included" : `${c.amount.toLocaleString()} EGP`}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold">Estimated total</span>
                  <span className="font-display text-lg font-semibold tabular-nums">
                    {totalCost.toLocaleString()} EGP
                  </span>
                </div>
              </div>

              {/* Landlord */}
              <div className="mt-6 border-t border-border pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {p.landlord.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {p.landlord.name}
                      {p.landlord.verified && <ShieldCheck className="h-3.5 w-3.5 text-trust" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Trust {p.landlord.trust.toFixed(1)} · responds {p.landlord.responseRate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "trust" | "muted";
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-muted/50 p-3">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
          tone === "trust" ? "bg-trust text-trust-foreground" : "bg-surface text-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
