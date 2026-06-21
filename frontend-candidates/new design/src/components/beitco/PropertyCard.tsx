import { Link } from "@tanstack/react-router";
import { MapPin, Wifi, ShieldCheck, Users } from "lucide-react";
import { TrustBadge } from "./TrustBadge";

export type Property = {
  id: string;
  title: string;
  area: string;
  type: "Apartment" | "Room" | "Bed";
  price: number;
  trust: number;
  reviews: number;
  residents: number;
  internet: number;
  image: string;
  verified?: boolean;
  beds?: { total: number; available: number };
};

export function PropertyCard({ p }: { p: Property }) {
  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
            {p.type}
          </span>
          {p.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2 py-0.5 text-[11px] font-medium text-trust-foreground">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <TrustBadge score={p.trust} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold">{p.title}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {p.area}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-base font-semibold tabular-nums">
              {p.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">EGP/mo</span>
            </div>
          </div>
        </div>

        {p.beds && (
          <div className="mt-3 rounded-lg bg-muted/60 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Beds</span>
              <span className="text-muted-foreground">
                {p.beds.available}/{p.beds.total} available
              </span>
            </div>
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: p.beds.total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < p.beds!.available ? "bg-trust" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Wifi className="h-3.5 w-3.5" /> Internet {p.internet.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {p.residents} residents · {p.reviews} reviews
          </span>
        </div>
      </div>
    </Link>
  );
}
