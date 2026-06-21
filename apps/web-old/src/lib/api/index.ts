// ─── API Client ─────────────────────────────────────
export { api, fetchPaginated, setTokens, clearTokens, getAccessToken, ApiClientError } from './client';
export type { PaginatedResult } from './client';

// ─── API Modules ────────────────────────────────────
export { authApi } from './auth';
export { feedApi, postsApi } from './feed';
export { listingsApi } from './listings';
export { usersApi } from './users';
export { commentsApi } from './comments';
export { groupsApi } from './groups';
export { chatApi } from './chat';
export { notificationsApi } from './notifications';
export { searchApi } from './search';

// ─── Adapters ───────────────────────────────────────
export {
  adaptUserSummary,
  adaptUserProfile,
  adaptPost,
  adaptListingSummary,
  adaptListingDetail,
  adaptComment,
  adaptCommentThread,
  adaptGroup,
  adaptConversation,
  adaptNotification,
} from './adapters';
