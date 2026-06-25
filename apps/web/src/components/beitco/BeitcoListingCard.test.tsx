import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BeitcoListingCard } from "./BeitcoListingCard";
import type { PropertySummary } from "@/lib/beitco/types";

// TEST-3: BeitcoListingCard renders a listing summary. We mock the router's
// <Link> to a plain <a> (lighter than a full memory router for a unit test).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));

const base: PropertySummary = {
  id: "p1",
  title: "أوضة مشتركة في المعادي",
  area: "المعادي · شارع 9",
  address: "شارع 9، المعادي",
  type: "سرير",
  price: 3200,
  trust: 8.6,
  reviewsCount: 12,
  residents: 8,
  internet: 9,
  image: "https://example.com/x.jpg",
  verified: true,
  beds: { total: 6, available: 3, occupied: 3 },
  rentalMode: "by_bed",
  listingType: "rent",
  priceFrom: 3200,
  negotiable: false,
  createdAt: "2026-06-01T00:00:00Z",
};

describe("BeitcoListingCard", () => {
  it("renders the title, area, and type", () => {
    render(<BeitcoListingCard p={base} />);
    expect(screen.getByText("أوضة مشتركة في المعادي")).toBeInTheDocument();
    expect(screen.getByText(/المعادي · شارع 9/)).toBeInTheDocument();
    expect(screen.getByText("سرير")).toBeInTheDocument();
  });

  it("shows the formatted price with the monthly suffix", () => {
    const { container } = render(<BeitcoListingCard p={base} />);
    // ar-EG-u-nu-latn = Arabic locale, Latin digits -> "3,200".
    expect(container.textContent).toContain("3,200");
    expect(screen.getByText("ج.م/شهر")).toBeInTheDocument();
  });

  it("renders the verified badge + the trust score", () => {
    render(<BeitcoListingCard p={base} />);
    expect(screen.getByText("موثّق")).toBeInTheDocument();
    expect(screen.getByText("8.6")).toBeInTheDocument();
  });

  it("links to the property detail route", () => {
    const { container } = render(<BeitcoListingCard p={base} />);
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("params");
  });

  it("shows the sale label + ج.م suffix for a for-sale listing", () => {
    render(
      <BeitcoListingCard
        p={{
          ...base,
          listingType: "sale",
          rentalMode: "whole",
          saleStatus: "available",
          salePrice: 4200000,
        }}
      />,
    );
    expect(screen.getByText("للبيع")).toBeInTheDocument();
    expect(screen.getByText("ج.م")).toBeInTheDocument();
  });

  it("renders the gender policy chip for female-only", () => {
    render(<BeitcoListingCard p={{ ...base, rentToGender: "female_only" }} />);
    expect(screen.getByText("بنات")).toBeInTheDocument();
  });
});
