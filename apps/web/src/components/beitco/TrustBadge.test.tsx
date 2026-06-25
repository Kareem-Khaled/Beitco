import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchX } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import { EmptyState } from "./EmptyState";

// TEST-3: a first React-Testing-Library render pass over two dependency-free
// presentational components (no Router/Query providers needed). Proves the
// jsdom + Testing Library setup works and locks the rendered content + the
// TrustBadge tone branches.

describe("TrustBadge", () => {
  it("renders the score to one decimal", () => {
    render(<TrustBadge score={9.2} />);
    expect(screen.getByText("9.2")).toBeInTheDocument();
  });

  it("uses the high-trust tone at >= 8.5", () => {
    const { container } = render(<TrustBadge score={8.5} />);
    expect(container.firstChild).toHaveClass("bg-trust");
  });

  it("uses the mid tone between 7 and 8.5", () => {
    const { container } = render(<TrustBadge score={7.4} />);
    expect(container.firstChild).toHaveClass("bg-accent");
  });

  it("uses the muted tone below 7", () => {
    const { container } = render(<TrustBadge score={6.2} />);
    expect(container.firstChild).toHaveClass("bg-muted");
  });

  it("rounds for display (8.96 -> 9.0)", () => {
    render(<TrustBadge score={8.96} />);
    expect(screen.getByText("9.0")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders the Arabic title + hint", () => {
    render(<EmptyState icon={SearchX} title="ما لقيناش حاجة" hint="جرّب تشيل فلاتر" />);
    expect(screen.getByText("ما لقيناش حاجة")).toBeInTheDocument();
    expect(screen.getByText("جرّب تشيل فلاتر")).toBeInTheDocument();
  });

  it("renders an action node when provided", () => {
    render(<EmptyState icon={SearchX} title="فاضي" action={<button>امسح الفلاتر</button>} />);
    expect(screen.getByRole("button", { name: "امسح الفلاتر" })).toBeInTheDocument();
  });

  it("omits the hint paragraph when not provided", () => {
    render(<EmptyState icon={SearchX} title="فاضي" />);
    expect(screen.queryByText(/جرّب/)).not.toBeInTheDocument();
  });
});
