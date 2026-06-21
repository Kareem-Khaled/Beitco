import { api, fetchPaginated } from './client';
import type { ListingSummary, ListingDetail, ListingSearchFilters } from '@beitco/types';

export const listingsApi = {
  list(filters?: ListingSearchFilters, cursor?: string) {
    const params: Record<string, string | number | boolean | undefined> = {
      ...filters,
    };
    return fetchPaginated<ListingSummary>('/listings', params, cursor);
  },

  getById(id: string) {
    return api.get<ListingDetail>(`/listings/${id}`);
  },

  create(data: {
    titleAr: string;
    titleEn?: string;
    listingType: string;
    propertyType: string;
    price: number;
    area: number;
    bedrooms?: number;
    bathrooms?: number;
    city?: string;
    district?: string;
    descriptionAr?: string;
    images?: string[];
  }) {
    return api.post<ListingDetail>('/listings', data);
  },

  save(id: string) {
    return api.post<{ saved: boolean }>(`/listings/${id}/save`);
  },

  unsave(id: string) {
    return api.delete<{ saved: boolean }>(`/listings/${id}/save`);
  },
};
