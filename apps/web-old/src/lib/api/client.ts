import type { ApiResponse, ApiError, PaginationMeta } from '@beitco/types';

// ─── Configuration ──────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** Skip auth header (for public endpoints like send-otp) */
  noAuth?: boolean;
}

// ─── Token Management ───────────────────────────────

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('beitco_access_token', access);
    localStorage.setItem('beitco_refresh_token', refresh);
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('beitco_access_token');
  }
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (refreshToken) return refreshToken;
  if (typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('beitco_refresh_token');
  }
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('beitco_access_token');
    localStorage.removeItem('beitco_refresh_token');
  }
}

// ─── Token Refresh ──────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const json = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
      if (json.success) {
        setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      }
      clearTokens();
      return false;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core Fetch ─────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function rawFetch<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params, headers = {}, noAuth = false } = options;

  // Build URL with query params
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Build headers
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!noAuth) {
    const token = getAccessToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — attempt refresh once
  if (res.status === 401 && !noAuth) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      // Retry with new token
      reqHeaders['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryRes = await fetch(url.toString(), {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(retryRes);
    }
    // Refresh failed — redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/ar/onboarding/phone';
    }
    throw new ApiClientError('UNAUTHORIZED', 'Session expired', 401);
  }

  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const json = await res.json();

  if (!res.ok || !json.success) {
    const error = json as ApiError;
    throw new ApiClientError(
      error.error?.code ?? 'UNKNOWN_ERROR',
      error.error?.message ?? 'An unexpected error occurred',
      res.status,
    );
  }

  return json as ApiResponse<T>;
}

// ─── Public API Methods ─────────────────────────────

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, options?: Omit<RequestOptions, 'method' | 'params'>) {
    return rawFetch<T>(path, { ...options, method: 'GET', params });
  },

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return rawFetch<T>(path, { ...options, method: 'POST', body });
  },

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return rawFetch<T>(path, { ...options, method: 'PATCH', body });
  },

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return rawFetch<T>(path, { ...options, method: 'PUT', body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, 'method'>) {
    return rawFetch<T>(path, { ...options, method: 'DELETE' });
  },
};

// ─── Pagination Helper ──────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export async function fetchPaginated<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  cursor?: string,
): Promise<PaginatedResult<T>> {
  const allParams = { ...params, ...(cursor ? { cursor } : {}) };
  const response = await api.get<T[]>(path, allParams);
  return {
    items: response.data,
    meta: response.meta ?? { cursor: null, hasMore: false },
  };
}
