// Matching engine — pure, deterministic preference scoring. Mirrors the trust
// engine's design: no localStorage/assets here, just `(property, profile) →
// explainable score`. `store.ts` calls `scoreMatch` and handles the storage
// side (`getMatchesForUser`). Keeping this pure makes it unit-testable.
//
// Principle: every match is *explainable* — we surface human-readable reasons
// it fits and misses where it falls short (same transparency ethos as trust).

import type { Property, RenterProfile } from "./types";

export type MatchResult = {
  score: number; // 0–100
  reasons: string[]; // why it fits
  misses: string[]; // where it falls short
  eligible: boolean; // false when a hard constraint (e.g. gender policy) rules it out
};

// Shared-housing gender policy: a male renter can't take a "بنات بس" listing and
// vice versa. Unknown renter gender → don't exclude (we just can't confirm the fit).
export function isGenderEligible(p: Property, prof: RenterProfile): boolean {
  if (!p.rentToGender) return true;
  if (!prof.selfGender) return true;
  return (
    (p.rentToGender === "male_only" && prof.selfGender === "ذكر") ||
    (p.rentToGender === "female_only" && prof.selfGender === "أنثى")
  );
}

export function scoreMatch(p: Property, prof: RenterProfile): MatchResult {
  let earned = 0;
  let possible = 0;
  const reasons: string[] = [];
  const misses: string[] = [];
  const price = p.priceFrom ?? p.price;

  // Hard constraint: shared-housing gender policy.
  if (!isGenderEligible(p, prof)) {
    return {
      score: 0,
      reasons: [],
      misses: [p.rentToGender === "male_only" ? "السكن ده لـ شباب بس" : "السكن ده لـ بنات بس"],
      eligible: false,
    };
  }

  // Preferred areas
  if (prof.areas && prof.areas.length) {
    possible += 30;
    if (prof.areas.some((a) => p.area.includes(a) || a.includes(p.area.split("·")[0].trim()))) {
      earned += 30;
      reasons.push("في منطقة بتحبها");
    } else {
      misses.push("بره مناطقك المفضلة");
    }
  }

  // Budget
  if (prof.budgetMax && prof.budgetMax > 0) {
    possible += 30;
    const minOk = !prof.budgetMin || price >= prof.budgetMin * 0.6;
    if (price <= prof.budgetMax && minOk) {
      earned += 30;
      reasons.push("في حدود ميزانيتك");
    } else if (price <= prof.budgetMax * 1.15) {
      earned += 15;
      reasons.push("قريب من ميزانيتك شوية");
    } else {
      misses.push("أغلى من ميزانيتك");
    }
  }

  // Looking for (type)
  if (prof.lookingFor && prof.lookingFor.length) {
    possible += 16;
    if (prof.lookingFor.includes(p.type)) {
      earned += 16;
      reasons.push(`${p.type} زي ما بتدوّر`);
    } else {
      misses.push("نوع تاني عن اللي بتدوّر عليه");
    }
  }

  // Near metro — considers preferred lines + max walking time.
  if (prof.nearMetro) {
    possible += 12;
    const metro = p.nearby?.find((n) => n.type === "مترو");
    if (metro) {
      const lineOk =
        !prof.metroLines?.length || (metro.line ? prof.metroLines.includes(metro.line) : false);
      const walkOk =
        !prof.maxWalkMinutes ||
        metro.minutes === undefined ||
        metro.minutes <= prof.maxWalkMinutes;
      let pts = 12;
      if (!lineOk) pts -= 4;
      if (!walkOk) pts -= 4;
      earned += Math.max(4, pts);
      reasons.push(metro.name ? `قريب من مترو ${metro.name}` : "قريب من المترو");
      if (prof.metroLines?.length && !lineOk) misses.push("مش على خط المترو اللي تفضّله");
      if (!walkOk) misses.push(`المترو أبعد من ${prof.maxWalkMinutes} دقيقة مشي`);
    } else {
      misses.push("مش قريب من المترو");
    }
  }

  // Near public transit (metro / buses / microbus)
  if (prof.nearTransit) {
    possible += 8;
    const transit = p.nearby?.find((n) => n.type === "مواصلات" || n.type === "مترو");
    if (transit) {
      earned += 8;
      reasons.push("مواصلات قريبة");
    } else {
      misses.push("مفيش مواصلات قريبة واضحة");
    }
  }

  // Must-have amenities
  if (prof.mustHaveAmenities && prof.mustHaveAmenities.length) {
    possible += 18;
    const have = prof.mustHaveAmenities.filter((a) => p.amenities.includes(a));
    const frac = have.length / prof.mustHaveAmenities.length;
    earned += Math.round(18 * frac);
    if (have.length === prof.mustHaveAmenities.length) {
      reasons.push("فيه كل المميزات اللي محتاجها");
    } else if (have.length > 0) {
      reasons.push(`فيه ${have.length} من ${prof.mustHaveAmenities.length} مميزات محتاجها`);
    } else {
      misses.push("ماعندوش المميزات اللي محتاجها");
    }
  }

  // Furnished preference
  if (prof.furnishedPref && prof.furnishedPref !== "any" && p.spec) {
    possible += 8;
    const wantFurnished = prof.furnishedPref === "furnished";
    if (p.spec.furnished === wantFurnished) {
      earned += 8;
      reasons.push(wantFurnished ? "مفروشة زي ما تحب" : "مش مفروشة زي ما تحب");
    } else {
      misses.push(wantFurnished ? "مش مفروشة" : "مفروشة");
    }
  }

  // Shared-housing gender fit (compatible & restrictive) — a positive signal.
  if (p.rentToGender && prof.selfGender) {
    possible += 10;
    earned += 10;
    reasons.push(p.rentToGender === "male_only" ? "سكن شباب — مناسب ليك" : "سكن بنات — مناسب ليك");
  }

  // No preferences set → fall back to trust as a soft signal.
  if (possible === 0) {
    return { score: Math.round(p.trust * 10), reasons: [], misses: [], eligible: true };
  }

  // Small availability nudge so live listings edge ahead.
  let score = Math.round((earned / possible) * 100);
  if (p.beds.available > 0 && score > 0) {
    score = Math.min(100, score + 3);
    reasons.push("فيه أماكن فاضية دلوقتي");
  }

  return { score, reasons, misses, eligible: true };
}
