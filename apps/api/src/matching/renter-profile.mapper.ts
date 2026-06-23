// Pure mappers between the Prisma RenterProfile row (+ User.gender) and the
// frontend RenterProfile shape (apps/web/src/lib/beitco/types.ts), plus the
// MatchProfile the engine consumes. No Nest/Prisma imports here so both the
// auth serializer and the matching service can use it without a DI cycle.
import type { MatchProfile } from './matching.engine';

// ── enum maps (frontend Arabic  <->  Prisma Latin) ──
const TYPE_AR: Record<string, string> = { apartment: 'شقة', room: 'أوضة', bed: 'سرير' };
const TYPE_LAT: Record<string, 'apartment' | 'room' | 'bed'> = {
  'شقة': 'apartment',
  'أوضة': 'room',
  'سرير': 'bed',
};
const OCC_AR: Record<string, string> = {
  student: 'طالب',
  employee: 'موظف',
  remote: 'شغل ريموت',
  freelance: 'حر',
  other: 'غير ده',
};
const OCC_LAT: Record<string, 'student' | 'employee' | 'remote' | 'freelance' | 'other'> = {
  'طالب': 'student',
  'موظف': 'employee',
  'شغل ريموت': 'remote',
  'حر': 'freelance',
  'غير ده': 'other',
};
const GENDERPREF_AR: Record<string, string> = { male: 'ذكر', female: 'أنثى', any: 'مايفرقش' };
const GENDERPREF_LAT: Record<string, 'male' | 'female' | 'any'> = {
  'ذكر': 'male',
  'أنثى': 'female',
  'مايفرقش': 'any',
};

export function genderToArabic(g: string | null | undefined): string | undefined {
  if (g === 'male') return 'ذكر';
  if (g === 'female') return 'أنثى';
  return undefined;
}
export function genderToPrisma(ar: string | null | undefined): 'male' | 'female' | undefined {
  if (ar === 'ذكر') return 'male';
  if (ar === 'أنثى') return 'female';
  return undefined;
}

// Loose Prisma row shape (only the fields we read).
export interface RenterProfileRow {
  intent: string;
  budgetMin: number | null;
  budgetMax: number | null;
  areas: string[];
  lookingFor: string[];
  moveInBy: Date | null;
  mustHaveAmenities: string[];
  nearMetro: boolean;
  metroLines: string[];
  maxWalkMinutes: number | null;
  nearTransit: boolean;
  furnishedPref: string | null;
  housematesGender: string | null;
  occupation: string | null;
  smoker: boolean | null;
  bio: string | null;
  updatedAt?: Date;
}

// Prisma row + the user's own gender -> frontend RenterProfile shape.
export function toFrontendProfile(
  row: RenterProfileRow | null | undefined,
  userGender: string | null | undefined,
): Record<string, unknown> | undefined {
  const selfGender = genderToArabic(userGender);
  if (!row) {
    // No saved prefs but we still surface selfGender (set at registration).
    return selfGender ? { selfGender } : undefined;
  }
  return {
    intent: row.intent === 'sale' ? 'buy' : 'rent',
    budgetMin: row.budgetMin ?? undefined,
    budgetMax: row.budgetMax ?? undefined,
    areas: row.areas,
    lookingFor: row.lookingFor.map((t) => TYPE_AR[t] ?? t),
    moveInBy: row.moveInBy?.toISOString(),
    mustHaveAmenities: row.mustHaveAmenities,
    nearMetro: row.nearMetro,
    metroLines: row.metroLines,
    maxWalkMinutes: row.maxWalkMinutes ?? undefined,
    nearTransit: row.nearTransit,
    furnishedPref: row.furnishedPref ?? undefined,
    gender: row.housematesGender ? (GENDERPREF_AR[row.housematesGender] ?? undefined) : undefined,
    selfGender,
    occupation: row.occupation ? (OCC_AR[row.occupation] ?? undefined) : undefined,
    smoker: row.smoker ?? undefined,
    bio: row.bio ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

// Frontend RenterProfile -> Prisma upsert data (+ the user's own gender, stored
// on User, not RenterProfile).
export interface FrontendProfileInput {
  intent?: 'rent' | 'buy';
  budgetMin?: number;
  budgetMax?: number;
  areas?: string[];
  lookingFor?: string[];
  moveInBy?: string;
  mustHaveAmenities?: string[];
  nearMetro?: boolean;
  metroLines?: string[];
  maxWalkMinutes?: number;
  nearTransit?: boolean;
  furnishedPref?: string;
  gender?: string;
  selfGender?: string;
  occupation?: string;
  smoker?: boolean;
  bio?: string;
}

export function toPrismaProfileData(p: FrontendProfileInput): {
  profile: Record<string, unknown>;
  userGender?: 'male' | 'female';
} {
  return {
    userGender: genderToPrisma(p.selfGender),
    profile: {
      intent: p.intent === 'buy' ? 'sale' : 'rent',
      budgetMin: p.budgetMin ?? null,
      budgetMax: p.budgetMax ?? null,
      areas: p.areas ?? [],
      lookingFor: (p.lookingFor ?? []).map((t) => TYPE_LAT[t] ?? t).filter(Boolean),
      moveInBy: p.moveInBy ? new Date(p.moveInBy) : null,
      mustHaveAmenities: p.mustHaveAmenities ?? [],
      nearMetro: p.nearMetro ?? false,
      metroLines: p.metroLines ?? [],
      maxWalkMinutes: p.maxWalkMinutes ?? null,
      nearTransit: p.nearTransit ?? false,
      furnishedPref: p.furnishedPref ?? null,
      housematesGender: p.gender ? (GENDERPREF_LAT[p.gender] ?? null) : null,
      occupation: p.occupation ? (OCC_LAT[p.occupation] ?? null) : null,
      smoker: p.smoker ?? null,
      bio: p.bio ?? null,
    },
  };
}

// Prisma row + user gender -> the engine's MatchProfile (lookingFor in Arabic,
// selfGender in Arabic; furnishedPref passes through unchanged).
export function toMatchProfile(
  row: RenterProfileRow | null | undefined,
  userGender: string | null | undefined,
): MatchProfile | null {
  if (!row) return null;
  return {
    selfGender: genderToArabic(userGender),
    areas: row.areas,
    budgetMin: row.budgetMin ?? undefined,
    budgetMax: row.budgetMax ?? undefined,
    lookingFor: row.lookingFor.map((t) => TYPE_AR[t] ?? t),
    nearMetro: row.nearMetro,
    metroLines: row.metroLines,
    maxWalkMinutes: row.maxWalkMinutes ?? undefined,
    nearTransit: row.nearTransit,
    mustHaveAmenities: row.mustHaveAmenities,
    furnishedPref: (row.furnishedPref as 'any' | 'furnished' | 'unfurnished' | null) ?? undefined,
  };
}

// What the renter is searching for: buyers see for-sale listings, renters rentals.
export function wantsSale(row: RenterProfileRow | null | undefined): boolean {
  return (row?.intent ?? 'rent') === 'sale';
}
