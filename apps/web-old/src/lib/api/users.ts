import { api, fetchPaginated } from './client';
import type { UserProfile, UserSummary } from '@beitco/types';

export const usersApi = {
  me() {
    return api.get<UserProfile>('/users/me');
  },

  getById(id: string) {
    return api.get<UserProfile>(`/users/${id}`);
  },

  updateMe(data: Partial<{ nameAr: string; nameEn: string; bio: string; avatarUrl: string; role: string }>) {
    return api.patch<UserProfile>('/users/me', data);
  },

  followers(userId: string, cursor?: string) {
    return fetchPaginated<UserSummary>(`/users/${userId}/followers`, undefined, cursor);
  },

  following(userId: string, cursor?: string) {
    return fetchPaginated<UserSummary>(`/users/${userId}/following`, undefined, cursor);
  },

  follow(userId: string) {
    return api.post<{ following: boolean }>(`/users/${userId}/follow`);
  },

  unfollow(userId: string) {
    return api.delete<{ following: boolean }>(`/users/${userId}/follow`);
  },

  block(userId: string) {
    return api.post<{ blocked: boolean }>(`/users/${userId}/block`);
  },

  unblock(userId: string) {
    return api.delete<{ blocked: boolean }>(`/users/${userId}/block`);
  },
};
