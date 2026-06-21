import type { FeedTab } from './enums';
import type { PostSummary } from './post';
import type { PaginationMeta } from './api';

export interface FeedResponse {
  tab: FeedTab;
  posts: PostSummary[];
  meta: PaginationMeta;
}
