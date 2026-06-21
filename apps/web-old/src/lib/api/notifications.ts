import { api, fetchPaginated } from './client';
import type { NotificationItem, UnreadCount } from '@beitco/types';

export const notificationsApi = {
  list(cursor?: string) {
    return fetchPaginated<NotificationItem>('/notifications', undefined, cursor);
  },

  unreadCount() {
    return api.get<UnreadCount>('/notifications/unread-count');
  },

  markRead(id: string) {
    return api.post<{ read: boolean }>(`/notifications/${id}/read`);
  },

  markAllRead() {
    return api.post<{ count: number }>('/notifications/read-all');
  },
};
