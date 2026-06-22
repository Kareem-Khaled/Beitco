// Typed API client for the Beitco backend (B-1). Behind the VITE_USE_API flag:
// when off (default), the app keeps reading from the localStorage mock so the
// prototype works with no backend. When on, reads come from the NestJS API.
// The returned shapes match lib/beitco/types.ts exactly (the API serializer
// mirrors the frontend Property shape), so callers don't change.

import type { Property, PropertySummary } from "./types";

export const USE_API =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_USE_API === "true";

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ??
  "http://localhost:3001/api/v1";

type Envelope<T> = {
  success: boolean;
  data: T;
  meta?: { cursor: string | null; hasMore: boolean };
  error?: { code: string; message: string };
};

async function getJSON<T>(path: string): Promise<Envelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  }
  return body;
}

// Build a query string from the frontend's search params (drops empties).
export type PropertyFilters = {
  q?: string;
  type?: string;
  purpose?: "rent" | "sale";
  gender?: "male_only" | "female_only";
  area?: string;
  freeOnly?: boolean;
  verifiedOnly?: boolean;
  nightly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "trust" | "price_asc" | "price_desc" | "newest";
  limit?: number;
  cursor?: string;
};

function toQuery(f: PropertyFilters = {}): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.type) p.set("type", f.type);
  if (f.purpose) p.set("purpose", f.purpose);
  if (f.gender) p.set("gender", f.gender);
  if (f.area) p.set("area", f.area);
  if (f.freeOnly) p.set("freeOnly", "true");
  if (f.verifiedOnly) p.set("verifiedOnly", "true");
  if (f.nightly) p.set("nightly", "true");
  if (f.minPrice != null) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
  if (f.sort) p.set("sort", f.sort);
  if (f.limit != null) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function apiListProperties(
  filters: PropertyFilters = {},
): Promise<{ items: PropertySummary[]; cursor: string | null; hasMore: boolean }> {
  const body = await getJSON<PropertySummary[]>(`/properties${toQuery({ limit: 50, ...filters })}`);
  return {
    items: body.data,
    cursor: body.meta?.cursor ?? null,
    hasMore: body.meta?.hasMore ?? false,
  };
}

export async function apiGetProperty(id: string): Promise<Property | undefined> {
  try {
    const body = await getJSON<Property>(`/properties/${encodeURIComponent(id)}`);
    return body.data;
  } catch {
    return undefined;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────
async function postJSON<T>(path: string, payload?: unknown): Promise<Envelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  }
  return body;
}

export async function apiRequestOtp(phone: string): Promise<{ devCode?: string }> {
  const body = await postJSON<{ expiresIn: number; devCode?: string }>("/auth/otp/send", { phone });
  return { devCode: body.data.devCode };
}

export async function apiVerifyOtp(
  phone: string,
  code: string,
): Promise<{ user: import("./types").User; isNewUser: boolean }> {
  const body = await postJSON<{ user: import("./types").User; isNewUser: boolean }>(
    "/auth/otp/verify",
    { phone, code },
  );
  return { user: body.data.user, isNewUser: body.data.isNewUser };
}

export async function apiCompleteProfile(payload: {
  name: string;
  role: "renter" | "owner" | "both";
  gender: "male" | "female";
}): Promise<import("./types").User> {
  const body = await postJSON<import("./types").User>("/auth/complete-profile", payload);
  return body.data;
}

export async function apiMe(): Promise<import("./types").User | null> {
  try {
    const body = await getJSON<import("./types").User>("/auth/me");
    return body.data;
  } catch {
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await postJSON("/auth/logout");
  } catch {
    // ignore — clearing local state is enough
  }
}
