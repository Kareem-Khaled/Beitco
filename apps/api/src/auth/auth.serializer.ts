// Maps a Prisma User row -> the frontend User shape (apps/web/src/lib/beitco/
// types.ts). Phone-identity model; no tiers (replaced by isAdmin + verification).
import { toFrontendProfile, type RenterProfileRow } from '../matching/renter-profile.mapper';

interface UserRow {
  id: string;
  phone: string;
  name: string;
  role: string;
  avatar?: string | null;
  gender?: string | null;
  isAdmin?: boolean;
  verified?: boolean;
  verificationStatus?: string | null;
  trust?: number;
  responseRate?: number | null;
  renterReputation?: number | null;
  notificationPrefs?: unknown;
  profile?: RenterProfileRow | null;
  createdAt?: Date;
}

export function serializeUser(u: UserRow): Record<string, unknown> {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    role: u.role,
    avatar: u.avatar ?? undefined,
    trust: u.trust ?? 5.0,
    verified: u.verified ?? false,
    verificationStatus: u.verificationStatus ?? 'unverified',
    responseRate: u.responseRate ?? undefined,
    renterReputation: u.renterReputation ?? undefined,
    isAdmin: u.isAdmin ?? false,
    notifications: u.notificationPrefs ?? undefined,
    // Renter preferences (powers matching). Present when the relation is loaded;
    // selfGender is surfaced from User.gender even without a saved profile row.
    profile: toFrontendProfile(u.profile ?? null, u.gender ?? null),
    createdAt: (u.createdAt ?? new Date()).toISOString(),
  };
}
