// Maps a Prisma User row -> the frontend User shape (apps/web/src/lib/beitco/
// types.ts). Phone-identity model; no tiers (replaced by isAdmin + verification).

interface UserRow {
  id: string;
  phone: string;
  name: string;
  role: string;
  avatar?: string | null;
  isAdmin?: boolean;
  verified?: boolean;
  verificationStatus?: string | null;
  trust?: number;
  responseRate?: number | null;
  renterReputation?: number | null;
  notificationPrefs?: unknown;
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
    createdAt: (u.createdAt ?? new Date()).toISOString(),
  };
}
