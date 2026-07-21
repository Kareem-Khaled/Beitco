import { describe, it, expect, beforeEach } from "vitest";
import {
  getPublishedProperties,
  getAdminUsers,
  getAdminListings,
  adminTakedownListing,
  adminRestoreListing,
  getAdminReviews,
  adminRemoveReview,
  getPlatformStats,
  getAdminFunnel,
  getAdminAreas,
} from "./store";

// TEST-3: the flag-aware data layer in MOCK mode (VITE_USE_API off  -  the test
// default). These back the operator portal + browse pages without a network,
// so they're the highest-value web units. localStorage (jsdom) is reset per test
// so each starts from the seed.

beforeEach(() => {
  localStorage.clear();
});

describe("browse data", () => {
  it("seeds + returns only published properties", () => {
    const pubs = getPublishedProperties();
    expect(pubs.length).toBeGreaterThan(0);
    expect(pubs.every((p) => p.status === "published")).toBe(true);
  });
});

describe("admin users (ADMIN-2 mock)", () => {
  it("returns all seeded users by default", () => {
    expect(getAdminUsers({}).length).toBeGreaterThanOrEqual(3);
  });

  it("filters by role", () => {
    const renters = getAdminUsers({ role: "renter" });
    expect(renters.length).toBeGreaterThan(0);
    expect(renters.every((u) => u.role === "renter")).toBe(true);
  });

  it("filters by verified", () => {
    expect(getAdminUsers({ verified: "true" }).every((u) => u.verified)).toBe(true);
    expect(getAdminUsers({ verified: "false" }).every((u) => !u.verified)).toBe(true);
  });

  it("filters to admins only", () => {
    const admins = getAdminUsers({ admins: "true" });
    expect(admins.length).toBeGreaterThan(0);
    expect(admins.every((u) => u.isAdmin)).toBe(true);
  });

  it("searches by name", () => {
    const all = getAdminUsers({});
    const target = all[0]!;
    const hit = getAdminUsers({ q: target.name.slice(0, 3) });
    expect(hit.some((u) => u.id === target.id)).toBe(true);
  });
});

describe("admin listings (ADMIN-3 mock)", () => {
  it("lists all published seed listings", () => {
    const rows = getAdminListings({ status: "published" });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === "published")).toBe(true);
  });

  it("takedown -> paused, restore -> published (round-trip)", () => {
    const target = getAdminListings({ status: "published" })[0]!;
    const down = adminTakedownListing(target.id, "اختبار");
    expect(down?.status).toBe("paused");
    expect(down?.rejectionReason).toBe("اختبار");

    // now it appears under paused, not published
    expect(getAdminListings({ status: "paused" }).some((r) => r.id === target.id)).toBe(true);
    expect(getAdminListings({ status: "published" }).some((r) => r.id === target.id)).toBe(false);

    const up = adminRestoreListing(target.id);
    expect(up?.status).toBe("published");
  });

  it("filters by Arabic type", () => {
    const apts = getAdminListings({ type: "شقة" });
    expect(apts.every((r) => r.type === "شقة")).toBe(true);
  });
});

describe("admin content moderation (ADMIN-4 mock)", () => {
  it("remove hides a review from the active filter + flips its flag", () => {
    const active = getAdminReviews({ removed: "false" });
    if (active.length === 0) return; // some seeds carry no reviews
    const target = active[0]!;
    const removed = adminRemoveReview(target.id, "مزيّف");
    expect(removed?.removed).toBe(true);
    expect(getAdminReviews({ removed: "false" }).some((r) => r.id === target.id)).toBe(false);
    expect(getAdminReviews({ removed: "true" }).some((r) => r.id === target.id)).toBe(true);
  });
});

describe("admin analytics (ADMIN-9 mock)", () => {
  it("platform stats expose the headline shape", () => {
    const s = getPlatformStats();
    expect(s.users.total).toBeGreaterThan(0);
    expect(s.listings.published).toBeGreaterThan(0);
    expect(s.listings.byType).toHaveProperty("شقة");
    expect(s.inventory.totalBeds).toBeGreaterThanOrEqual(s.inventory.availableBeds);
  });

  it("funnel stages are ordered users -> ... -> tenancies", () => {
    const f = getAdminFunnel();
    expect(f.stages.map((x) => x.key)).toEqual([
      "users",
      "savers",
      "leads",
      "approved",
      "tenancies",
    ]);
  });

  it("areas carry supply/demand/gap", () => {
    const areas = getAdminAreas();
    expect(Array.isArray(areas)).toBe(true);
    if (areas.length) {
      expect(areas[0]).toHaveProperty("supply");
      expect(areas[0]).toHaveProperty("gap");
    }
  });
});
