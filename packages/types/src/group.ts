import type {
  GroupType,
  GroupPrivacy,
  PostingRules,
  GroupMemberRole,
  GroupMemberStatus,
} from './enums';
import type { UserSummary } from './user';

export interface GroupSummary {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  groupType: GroupType;
  privacy: GroupPrivacy;
  coverPhotoUrl: string | null;
  avatarUrl: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
}

export interface GroupDetail extends GroupSummary {
  descriptionAr: string | null;
  descriptionEn: string | null;
  postingRules: PostingRules;
  locationLat: number | null;
  locationLng: number | null;
  city: string | null;
  district: string | null;
  creator: UserSummary;
  myRole: GroupMemberRole | null;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  user: UserSummary;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string;
}
