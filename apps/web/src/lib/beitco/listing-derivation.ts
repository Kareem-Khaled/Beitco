// Listing derivation — pure functions that compute card/search-facing fields
// (type, entry price, unit counts) from the structured apartment→rooms→beds
// model. No storage access; store.ts calls these. Mirrors trust.ts / matching.ts.

import type { Property, PropertyType } from "./types";

type Summarizable = Pick<
  Property,
  | "rentalMode"
  | "wholePrice"
  | "wholeStatus"
  | "rooms"
  | "spec"
  | "price"
  | "beds"
  | "type"
  | "listingType"
  | "salePrice"
  | "saleStatus"
>;

export function summarizeListing(p: Summarizable): {
  type: PropertyType;
  priceFrom: number;
  beds: { total: number; available: number; occupied: number };
} {
  // For-sale: a single whole unit at one asking price.
  if (p.listingType === "sale") {
    const isAvail = (p.saleStatus ?? "available") === "available";
    return {
      type: "شقة",
      priceFrom: p.salePrice ?? p.price ?? 0,
      beds: { total: 1, available: isAvail ? 1 : 0, occupied: isAvail ? 0 : 1 },
    };
  }

  if (p.rentalMode === "whole") {
    const total = p.spec?.bedrooms ?? 1;
    const isFree = (p.wholeStatus ?? "available") === "available";
    return {
      type: "شقة",
      priceFrom: p.wholePrice ?? p.price ?? 0,
      beds: { total, available: isFree ? 1 : 0, occupied: isFree ? 0 : 1 },
    };
  }

  if (p.rentalMode === "by_room") {
    const rooms = p.rooms ?? [];
    const total = rooms.length;
    const availableRooms = rooms.filter((r) => (r.status ?? "available") === "available");
    const prices = (availableRooms.length ? availableRooms : rooms)
      .map((r) => r.price ?? 0)
      .filter((n) => n > 0);
    return {
      type: "أوضة",
      priceFrom: prices.length ? Math.min(...prices) : (p.price ?? 0),
      beds: { total, available: availableRooms.length, occupied: total - availableRooms.length },
    };
  }

  if (p.rentalMode === "by_bed") {
    const beds = (p.rooms ?? []).flatMap((r) => r.beds ?? []);
    const total = beds.length;
    const availableBeds = beds.filter((b) => b.status === "available");
    const prices = (availableBeds.length ? availableBeds : beds)
      .map((b) => b.price)
      .filter((n) => n > 0);
    return {
      type: "سرير",
      priceFrom: prices.length ? Math.min(...prices) : (p.price ?? 0),
      beds: { total, available: availableBeds.length, occupied: total - availableBeds.length },
    };
  }

  // Legacy property without structured fields — keep existing values.
  return { type: p.type, priceFrom: p.price ?? 0, beds: p.beds };
}

// Recompute the denormalized fields whenever the structured model is present,
// so cards/search/dashboard stay in sync without manual updates.
export function normalizeProperty(p: Property): Property {
  if (!p.rentalMode && p.listingType !== "sale") return p;
  const s = summarizeListing(p);
  return { ...p, type: s.type, price: s.priceFrom, priceFrom: s.priceFrom, beds: s.beds };
}
