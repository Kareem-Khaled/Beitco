import { api, fetchPaginated } from './client';
import type { PostSummary } from '@beitco/types';

export const feedApi = {
  forYou(cursor?: string) {
    return fetchPaginated<PostSummary>('/feed/for-you', undefined, cursor);
  },

  following(cursor?: string) {
    return fetchPaginated<PostSummary>('/feed/following', undefined, cursor);
  },

  videos(cursor?: string) {
    return fetchPaginated<PostSummary>('/feed/videos', undefined, cursor);
  },

  trending(cursor?: string) {
    return fetchPaginated<PostSummary>('/feed/trending', undefined, cursor);
  },
};

export const postsApi = {
  getById(id: string) {
    return api.get<PostSummary>(`/posts/${id}`);
  },

  create(data: { contentText: string; postType: string; media?: { url: string; type: string }[] }) {
    return api.post<PostSummary>('/posts', data);
  },

  like(id: string) {
    return api.post<{ liked: boolean }>(`/posts/${id}/like`);
  },

  unlike(id: string) {
    return api.delete<{ liked: boolean }>(`/posts/${id}/like`);
  },

  save(id: string) {
    return api.post<{ saved: boolean }>(`/posts/${id}/save`);
  },

  unsave(id: string) {
    return api.delete<{ saved: boolean }>(`/posts/${id}/save`);
  },
};
