import { mockListings, formatPrice } from "@/data/mockData";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const filterTabs = [
  { id: "all", label: "الكل" },
  { id: "sale", label: "للبيع" },
  { id: "rent", label: "للإيجار" },
];

export default function ListingsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all"
    ? mockListings
    : mockListings.filter((l) => l.purpose === activeFilter);

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="p-4">
        <h1 className="text-h1 font-bold mb-4">العقارات</h1>

        <div className="flex gap-2 mb-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "px-4 py-2 rounded-pill text-caption font-medium transition-colors touch-target",
                activeFilter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              className="bg-card rounded-card shadow-card overflow-hidden hover:shadow-elevated transition-shadow"
            >
              <div className="relative">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
                <span className={cn(
                  "absolute top-3 start-3 px-2 py-1 rounded text-micro font-medium",
                  listing.purpose === "rent"
                    ? "bg-gold text-gold-foreground"
                    : "bg-success text-success-foreground"
                )}>
                  {listing.purpose === "rent" ? "إيجار" : "بيع"}
                </span>
              </div>
              <div className="p-3">
                <p className="font-mono text-h3 font-bold text-primary">
                  {formatPrice(listing.price, listing.purpose)}
                </p>
                <p className="text-caption text-foreground mt-1 font-medium">{listing.title}</p>
                <p className="text-micro text-muted-foreground mt-0.5">📍 {listing.location}</p>
                <div className="flex items-center gap-3 mt-2 text-micro text-muted-foreground">
                  <span>🛏️ {listing.bedrooms}</span>
                  <span>🚿 {listing.bathrooms}</span>
                  <span>📐 {listing.area} م²</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
