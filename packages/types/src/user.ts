import type { PermissionTier, UserRole } from './enums';

export interface UserSummary {
  id: string;
  username: string | null;
  nameAr: string;
  nameEn: string | null;
  avatarUrl: string | null;
  permissionTier: PermissionTier;
  isVerified: boolean;
  followerCount: number;
}

export interface UserProfile extends UserSummary {
  phone: string;
  email: string | null;
  role: UserRole;
  coverPhotoUrl: string | null;
  bio: string | null;
  nationalIdVerified: boolean;
  agentLicenseVerified: boolean;
  trustScore: number;
  reputationScore: number;
  followingCount: number;
  postCount: number;
  createdAt: string;
  preferences: Record<string, unknown>;
}
