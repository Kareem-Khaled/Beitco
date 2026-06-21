import type { UserSummary } from './user';

export interface ReviewSummary {
  id: string;
  author: UserSummary;
  rating: number;
  content: string | null;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
