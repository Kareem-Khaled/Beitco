import { api } from './client';

export interface SearchResults {
  posts: unknown[];
  users: unknown[];
  groups: unknown[];
  listings: unknown[];
  hashtags: string[];
}

export const searchApi = {
  search(query: string, type?: 'all' | 'posts' | 'users' | 'groups' | 'listings') {
    return api.get<SearchResults>('/search', { q: query, type });
  },

  suggestions(query: string) {
    return api.get<string[]>('/search/suggestions', { q: query });
  },

  trending() {
    return api.get<string[]>('/search/trending');
  },
};
