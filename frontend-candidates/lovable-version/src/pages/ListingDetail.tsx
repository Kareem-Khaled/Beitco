import { useParams, Link } from "react-router-dom";
import { ArrowRight, Share2, MoreHorizontal, Phone, MessageCircle, Star, BadgeCheck } from "lucide-react";
import { mockListings, formatPrice } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ListingDetail() {
  const { id } = useParams();
  const listing = mockListings.find((l) => l.id === id) || mockListings[0];
  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="max-w-[680px] mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 h-14 border-b border-border">
        <Link to="/listings" className="touch-target flex items-center justify-center">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1">
          <button className="touch-target flex items-center justify-center">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="touch-target flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="relative">
        <img
          src={listing.images[activeImage]}
          alt={listing.title}
          className="w-full aspect-video object-cover"
        />
        {listing.images.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {listing.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === activeImage ? "bg-primary-foreground" : "bg-primary-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Price & Basic Info */}
        <div>
          <p className="font-mono text-display font-bold text-primary">
            💰 {formatPrice(listing.price, listing.purpose)}
          </p>
          <p className="text-body text-muted-foreground mt-1">📍 {listing.location}</p>
          <p className="text-caption text-muted-foreground mt-0.5">
            🏠 {listing.type} | {listing.purpose === "sale" ? "للبيع" : "للإيجار"}
          </p>
        </div>

        {/* Quick Specs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "غرف نوم", value: listing.bedrooms, icon: "🛏️" },
            { label: "حمام", value: listing.bathrooms, icon: "🚿" },
            { label: "المساحة", value: `${listing.area} م²`, icon: "📐" },
          ].map((spec) => (
            <div key={spec.label} className="bg-muted rounded-card p-3 text-center">
              <span className="text-h2">{spec.icon}</span>
              <p className="font-mono text-h3 font-bold mt-1">{spec.value}</p>
              <p className="text-micro text-muted-foreground">{spec.label}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="bg-card rounded-card shadow-card p-4">
          <h3 className="text-h3 font-semibold mb-3">التفاصيل</h3>
          <div className="grid grid-cols-2 gap-y-3 text-caption">
            <div>
              <span className="text-muted-foreground">التشطيب:</span>
              <span className="ms-2 font-medium">{listing.finishing}</span>
            </div>
            {listing.floor !== undefined && listing.floor > 0 && (
              <div>
                <span className="text-muted-foreground">الدور:</span>
                <span className="ms-2 font-medium">{listing.floor}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">مفروش:</span>
              <span className="ms-2 font-medium">{listing.furnished ? "نعم" : "لا"}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="text-h3 font-semibold mb-2">الوصف</h3>
            <p className={cn("text-body text-muted-foreground leading-relaxed", !expanded && "line-clamp-3")}>
              {listing.description}
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-primary text-caption font-medium mt-1"
            >
              {expanded ? "أقل" : "اقرأ المزيد"}
            </button>
          </div>
        )}

        {/* Agent */}
        <div className="bg-card rounded-card shadow-card p-4">
          <h3 className="text-h3 font-semibold mb-3">نشر بواسطة</h3>
          <div className="flex items-center gap-3">
            <img
              src={listing.agent.avatar}
              alt={listing.agent.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold truncate">{listing.agent.name}</span>
                {listing.agent.verified && <BadgeCheck className="w-4 h-4 text-success shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-micro text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  {listing.rating} ({listing.reviewCount})
                </span>
                <span>⏱️ {listing.responseTime}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1">عرض الملف</Button>
            <Button variant="outline" size="sm" className="flex-1">متابعة</Button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <div className="max-w-[680px] mx-auto flex gap-3">
          <Button className="flex-1 gap-2">
            <Phone className="w-4 h-4" />
            اتصل
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <MessageCircle className="w-4 h-4" />
            محادثة
          </Button>
        </div>
      </div>
    </div>
  );
}
