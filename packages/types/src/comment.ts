import type { CommentStatus } from './enums';
import type { UserSummary } from './user';

export interface CommentSummary {
  id: string;
  postId: string;
  author: UserSummary;
  parentCommentId: string | null;
  content: string;
  likeCount: number;
  isPinned: boolean;
  status: CommentStatus;
  isLiked: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentThread extends CommentSummary {
  replies: CommentSummary[];
}
