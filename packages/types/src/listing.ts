import type {
  ListingType,
  PropertyType,
  FinishingType,
  ListingStatus,
} from './enums';
import type { UserSummary } from './user';

export interface ListingSummary {
  id: string;
  titleAr: string;
  titleEn: string | null;
  listingType: ListingType;
  propertyType: PropertyType;
  price: number;
  currency: string;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string | null;
  district: string | null;
  images: string[];
  status: ListingStatus;
  isSaved: boolean;
  createdAt: string;
}

export interface ListingDetail extends ListingSummary {
  agent: UserSummary;
  descriptionAr: string | null;
  descriptionEn: string | null;
  floor: number | null;
  finishing: FinishingType | null;
  amenities: string[];
  locationLat: number | null;
  locationLng: number | null;
  address: string | null;
  compound: string | null;
  viewCount: number;
  saveCount: number;
  inquiryCount: number;
  expiresAt: string | null;
  updatedAt: string;
}

export interface ListingSearchFilters {
  listingType?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  district?: string;
  finishing?: FinishingType;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}
