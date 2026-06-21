import { PermissionTier, UserRole } from '@prisma/client';

/**
 * Shape of the authenticated user attached to req.user by JwtStrategy.
 */
export interface AuthenticatedUser {
  id: string;
  phone: string;
  email: string | null;
  nameAr: string;
  nameEn: string | null;
  role: UserRole;
  permissionTier: PermissionTier;
  avatarUrl: string | null;
  nationalIdVerified: boolean;
  agentLicenseVerified: boolean;
  trustScore: number;
  reputationScore: number;
  followerCount: number;
  followingCount: number;
  postCount: number;
  deletedAt: Date | null;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}
