import { Star } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import newCairo from "@/assets/area-new-cairo.jpg";
import zayed from "@/assets/area-sheikh-zayed.jpg";
import maadi from "@/assets/area-maadi.jpg";
import alex from "@/assets/area-alexandria.jpg";

const areas = [
  { name: "New Cairo", image: newCairo, rating: 4.6, listings: 1284, vibe: "Family · Compounds" },
  { name: "Sheikh Zayed", image: zayed, rating: 4.7, listings: 932, vibe: "Quiet · Green" },
  { name: "Maadi", image: maadi, rating: 4.8, listings: 1561, vibe: "Walkable · Cafés" },
  { name: "Alexandria", image: alex, rating: 4.4, listings: 712, vibe: "Sea · Affordable" },
];

export function TopAreas() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Area intelligence"
        title="Top rated areas in Egypt"
        description="Everything you need to know before living somewhere — transport, safety, schools, vibe."
        action="Explore all areas"
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {areas.map((a) => (
          <button
            key={a.name}
            type="button"
            className="group relative overflow-hidden rounded-2xl border border-border text-left"
          >
            <img
              src={a.image}
              alt={a.name}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-background">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">{a.name}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/15 px-2 py-0.5 text-xs backdrop-blur">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {a.rating}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs opacity-90">
                <span>{a.vibe}</span>
                <span>{a.listings.toLocaleString()} listings</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
