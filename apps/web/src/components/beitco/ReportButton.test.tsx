import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportButton } from "./ReportButton";
import { getAdminReports } from "@/lib/beitco/store";

// TEST-3: ReportButton interaction. Mock the cross-cutting deps (auth, router,
// toast); the report write itself goes through the real mock-mode store
// (VITE_USE_API off), so we assert the report actually lands.

const navigate = vi.fn();
let currentUser: { id: string; name: string } | null = { id: "u-renter-ahmed", name: "أحمد" };

vi.mock("@/lib/beitco/auth", () => ({
  useAuth: () => ({ user: currentUser }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("ReportButton", () => {
  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
    currentUser = { id: "u-renter-ahmed", name: "أحمد" };
  });

  it("renders the report affordance", () => {
    render(<ReportButton targetType="listing" targetId="1" />);
    expect(screen.getByText("بلّغ")).toBeInTheDocument();
  });

  it("redirects to login + does not open the dialog when logged out", async () => {
    currentUser = null;
    const user = userEvent.setup();
    render(<ReportButton targetType="listing" targetId="1" />);
    await user.click(screen.getByRole("button"));
    expect(navigate).toHaveBeenCalledWith({ to: "/auth/login" });
    expect(screen.queryByText("بلّغ عن الإعلان")).not.toBeInTheDocument();
  });

  it("opens the dialog with reason chips for a logged-in user", async () => {
    const user = userEvent.setup();
    render(<ReportButton targetType="listing" targetId="1" />);
    await user.click(screen.getByText("بلّغ"));
    expect(await screen.findByText("بلّغ عن الإعلان")).toBeInTheDocument();
    expect(screen.getByText("إعلان وهمي أو نصب")).toBeInTheDocument();
  });

  it("writes a report (mock store) when a reason is chosen + submitted", async () => {
    const user = userEvent.setup();
    render(<ReportButton targetType="listing" targetId="1" />);
    await user.click(screen.getByText("بلّغ"));
    await user.click(await screen.findByText("صور مش حقيقية"));
    await user.click(screen.getByRole("button", { name: "ابعت البلاغ" }));

    await waitFor(() => {
      const reports = getAdminReports({});
      expect(reports.some((r) => r.targetId === "1" && r.reason === "صور مش حقيقية")).toBe(true);
    });
  });
});
