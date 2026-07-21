import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Wifi,
  ShieldCheck,
  Users,
  Home,
  Mars,
  Venus,
  BedDouble,
  DoorOpen,
  Moon,
} from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import { OptimizedImage } from "./OptimizedImage";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Property, PropertySummary, Room, BedStatus } from "@/lib/beitco/types";

type CardProperty = PropertySummary | Property;

// Loading placeholder that mirrors the card layout (image + text block), so the
// grid keeps its shape while listings load or the next page is fetched.
export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface" aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function BeitoonListingCard({ p, className }: { p: CardProperty; className?: string }) {
  const isSale = p.listingType === "sale";
  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {p.image ? (
          <OptimizedImage
            src={p.image}
            alt={p.title}
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            بدون صور
          </div>
        )}
        <div className="absolute start-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
            {p.type}
          </span>
          {isSale && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground shadow-sm backdrop-blur">
              للبيع
            </span>
          )}
          {!isSale && p.nightlyPrice ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/95 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
              <Moon className="h-3 w-3" />
              بالليلة
            </span>
          ) : null}
          {p.rentToGender && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur ${
                p.rentToGender === "male_only" ? "bg-sky-500/95" : "bg-pink-500/95"
              }`}
            >
              {p.rentToGender === "male_only" ? (
                <Mars className="h-3 w-3" />
              ) : (
                <Venus className="h-3 w-3" />
              )}
              {p.rentToGender === "male_only" ? "شباب" : "بنات"}
            </span>
          )}
          {p.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2 py-0.5 text-[11px] font-medium text-trust-foreground">
              <ShieldCheck className="h-3 w-3" />
              موثّق
            </span>
          )}
        </div>
        <div className="absolute end-3 top-3">
          <TrustBadge score={p.trust} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-semibold">{p.title}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {p.area}
            </div>
          </div>
          <div className="text-end">
            <div className="font-display text-base font-semibold tabular-nums">
              {!isSale && p.rentalMode && p.rentalMode !== "whole" && (
                <span className="block text-[10px] font-normal text-muted-foreground">يبدأ من</span>
              )}
              {(p.priceFrom ?? p.price).toLocaleString("ar-EG-u-nu-latn")}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {isSale ? "ج.م" : "ج.م/شهر"}
              </span>
            </div>
          </div>
        </div>

        {isSale ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 p-2.5 text-xs">
            <Home className="h-3.5 w-3.5 text-trust" />
            <span className="font-medium text-foreground">
              {p.saleStatus === "sold" ? "اتباعت" : "شقة للبيع"}
            </span>
            {p.spec && (
              <span className="text-muted-foreground">
                · {p.spec.bedrooms.toLocaleString("ar-EG-u-nu-latn")} أوض
                {p.spec.sizeM2 ? ` · ${p.spec.sizeM2.toLocaleString("ar-EG-u-nu-latn")} م²` : ""}
              </span>
            )}
          </div>
        ) : p.rentalMode === "whole" ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 p-2.5 text-xs">
            <Home className="h-3.5 w-3.5 text-trust" />
            <span className="font-medium text-foreground">شقة كاملة</span>
            {p.spec && (
              <span className="text-muted-foreground">
                · {p.spec.bedrooms.toLocaleString("ar-EG-u-nu-latn")} أوض ·{" "}
                {p.spec.bathrooms.toLocaleString("ar-EG-u-nu-latn")} حمام
              </span>
            )}
          </div>
        ) : p.beds ? (
          <AvailabilityBlock
            isRoom={p.rentalMode === "by_room"}
            beds={p.beds}
            rooms={"rooms" in p ? p.rooms : undefined}
          />
        ) : null}

        {isSale ? (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Home className="h-3 w-3" />
              {p.spec?.furnished ? "مفروشة" : "مش مفروشة"}
            </span>
            {p.spec?.floor != null && (
              <span>الدور {p.spec.floor.toLocaleString("ar-EG-u-nu-latn")}</span>
            )}
            {p.negotiable && <span>قابل للتفاوض</span>}
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {p.residents} ساكن
            </span>
            <span className="inline-flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              نت {p.internet}
            </span>
            <span>{p.reviewsCount} رأي</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// Availability for room/bed listings. Replaces the old green "progress bar"
// (which read like an occupancy meter) with a clear worded badge + discrete
// unit chips so it's obvious how many beds/rooms are actually free.
// For by-bed listings with room data, beds are grouped inside their own room
// box so it's clear which beds share a room.
function AvailabilityBlock({
  isRoom,
  beds,
  rooms,
}: {
  isRoom: boolean;
  beds: { total: number; available: number; occupied: number };
  rooms?: Room[];
}) {
  const Icon = isRoom ? DoorOpen : BedDouble;
  const total = beds.total;
  const available = Math.max(0, beds.available);
  const full = available <= 0;

  // Group beds by their room only for by-bed listings where we have room data.
  const roomsWithBeds = (rooms ?? []).filter((r) => (r.beds?.length ?? 0) > 0);
  const grouped = !isRoom && roomsWithBeds.length > 0;

  // Fallback (summaries without room data): cap chips so big flats don't overflow.
  const MAX_CHIPS = 10;
  const chips = Math.min(total, MAX_CHIPS);

  return (
    <div className="mt-3 rounded-lg bg-muted/60 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {isRoom ? "أوض للإيجار" : "سراير للإيجار"}
        </span>
        {full ? (
          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            مفيش فاضي
          </span>
        ) : (
          <span className="rounded-full bg-trust-soft px-2 py-0.5 text-[11px] font-semibold text-trust">
            {available.toLocaleString("ar-EG-u-nu-latn")} فاضي
          </span>
        )}
      </div>

      {grouped ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {roomsWithBeds.map((room) => (
            <div
              key={room.id}
              title={room.name}
              className="flex items-center gap-1 rounded-md border border-border bg-background/70 p-1"
            >
              {(room.beds ?? []).map((bed) => (
                <BedChip key={bed.id} status={bed.status} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {Array.from({ length: chips }).map((_, i) => (
            <UnitChip key={i} Icon={Icon} available={i < available} />
          ))}
          {total > MAX_CHIPS && (
            <span className="text-[11px] text-muted-foreground">
              +{(total - MAX_CHIPS).toLocaleString("ar-EG-u-nu-latn")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// On the public card we only care about free vs taken  -  a renter doesn't need
// the owner-only distinction between "reserved" and "occupied". Both = taken.
function BedChip({ status }: { status: BedStatus }) {
  const available = status === "available";
  return (
    <span
      title={available ? "فاضي" : "متحجوز"}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
        available
          ? "border-trust/40 bg-trust-soft text-trust"
          : "border-border bg-muted text-muted-foreground/40"
      }`}
    >
      <BedDouble className="h-3 w-3" />
    </span>
  );
}

function UnitChip({
  Icon,
  available,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}) {
  return (
    <span
      title={available ? "فاضي" : "متحجوز"}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
        available
          ? "border-trust/40 bg-trust-soft text-trust"
          : "border-border bg-muted text-muted-foreground/40"
      }`}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}
