import { ShieldCheck, Gauge, Users, Receipt } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Trust score on every listing",
    body: "Verified landlords, identity-checked residents, transparent review history. No fake listings.",
  },
  {
    icon: Gauge,
    title: "Housing quality, scored",
    body: "Internet, safety, noise, maintenance and cleanliness — measured by people who actually live there.",
  },
  {
    icon: Receipt,
    title: "True monthly cost",
    body: "Rent + utilities + internet + service fees, all upfront. No surprises after you move in.",
  },
  {
    icon: Users,
    title: "Community knowledge",
    body: "Ask real residents. Compare areas. Read honest reviews before you commit to a place.",
  },
];

export function TrustPillars() {
  return (
    <section className="border-y border-border bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="flex flex-col gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-trust-soft text-primary">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold leading-tight">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
