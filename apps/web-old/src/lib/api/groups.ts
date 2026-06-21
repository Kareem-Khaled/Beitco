import { api, fetchPaginated } from './client';
import type { GroupSummary, GroupDetail } from '@beitco/types';

export const groupsApi = {
  list(cursor?: string) {
    return fetchPaginated<GroupSummary>('/groups', undefined, cursor);
  },

  myGroups(cursor?: string) {
    return fetchPaginated<GroupSummary>('/groups/my', undefined, cursor);
  },

  getById(id: string) {
    return api.get<GroupDetail>(`/groups/${id}`);
  },

  join(id: string) {
    return api.post<{ joined: boolean }>(`/groups/${id}/join`);
  },

  leave(id: string) {
    return api.delete<{ joined: boolean }>(`/groups/${id}/join`);
  },
};
