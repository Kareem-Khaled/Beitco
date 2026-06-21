import { Search, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-home.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-trust-soft/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[420px] rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            The trusted housing platform for Egypt
          </span>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Know where you’re moving
            <span className="block text-primary"> before you move in.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Verified apartments, rooms and beds — with real reviews from real residents,
            area intelligence, and true monthly cost. So you can finally answer:
            <em className="not-italic text-foreground"> can I trust this place?</em>
          </p>

          {/* Search */}
          <div className="mt-7 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="New Cairo, Maadi, Sheikh Zayed…"
              />
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Apartment, room or bed"
              />
            </div>
            <Button size="lg" className="rounded-xl">Explore</Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-trust" />
              Trust score on every listing
            </span>
            <span>Real reviews from residents</span>
            <span>Internet · safety · noise scored</span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-elevated)]">
            <img
              src={heroImg}
              alt="Sunlit modern apartment interior in Egypt"
              width={1600}
              height={1200}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>

          {/* Floating trust card */}
          <div className="absolute -left-4 bottom-6 hidden w-64 rounded-2xl border border-border bg-surface/95 p-4 shadow-[var(--shadow-elevated)] backdrop-blur sm:block">
            <div className="flex items-center gap-2 text-xs font-medium text-trust">
              <ShieldCheck className="h-4 w-4" />
              Verified by 18 residents
            </div>
            <div className="mt-2 font-display text-2xl font-semibold">Trust 9.2</div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>Internet · 9.4</span><span>Safety · 9.1</span>
              <span>Noise · 8.7</span><span>Maintenance · 9.0</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
