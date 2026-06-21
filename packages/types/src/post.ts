import type { PostType, PostStatus } from './enums';
import type { UserSummary } from './user';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  order: number;
}

export interface PostSummary {
  id: string;
  author: UserSummary;
  postType: PostType;
  contentText: string | null;
  media: MediaItem[];
  hashtags: string[];
  status: PostStatus;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}
