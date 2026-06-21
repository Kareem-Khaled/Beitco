// ─── Standard API Response Wrappers ─────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationMeta {
  cursor: string | null;
  hasMore: boolean;
  total?: number;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
