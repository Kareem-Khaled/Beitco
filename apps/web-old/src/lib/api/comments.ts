import { api, fetchPaginated } from './client';
import type { CommentThread, CommentSummary } from '@beitco/types';

export const commentsApi = {
  list(postId: string, cursor?: string) {
    return fetchPaginated<CommentThread>(`/posts/${postId}/comments`, undefined, cursor);
  },

  replies(commentId: string, cursor?: string) {
    return fetchPaginated<CommentSummary>(`/comments/${commentId}/replies`, undefined, cursor);
  },

  create(postId: string, content: string, parentCommentId?: string) {
    return api.post<CommentSummary>(`/posts/${postId}/comments`, { content, parentCommentId });
  },

  update(commentId: string, content: string) {
    return api.patch<CommentSummary>(`/comments/${commentId}`, { content });
  },

  delete(commentId: string) {
    return api.delete(`/comments/${commentId}`);
  },

  like(commentId: string) {
    return api.post<{ liked: boolean }>(`/comments/${commentId}/like`);
  },

  unlike(commentId: string) {
    return api.delete<{ liked: boolean }>(`/comments/${commentId}/like`);
  },

  pin(commentId: string) {
    return api.post<{ pinned: boolean }>(`/comments/${commentId}/pin`);
  },
};
