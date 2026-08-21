import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { NavBar } from "../nav-bar";
import { renderWithClient } from "@/lib/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { name: "Dana H", email: "dana@northwind.co" } } }),
  authClient: { signOut: vi.fn() },
}));

const supportAdminState = { supportAdmin: false, isPending: false };

vi.mock("@/lib/support/use-support-admin", () => ({
  useSupportAdmin: () => supportAdminState,
}));

vi.mock("@/lib/api/queries", () => ({
  useNotifications: () => ({ data: [], isLoading: false, error: null }),
  useMarkNotificationRead: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteNotification: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAllNotifications: () => ({ mutate: vi.fn(), isPending: false }),
  useGroups: () => ({ data: [], isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroup: () => ({ data: undefined, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),
}));

describe("NavBar", () => {
  it("renders the primary navigation links", () => {
    renderWithClient(<NavBar />);
    // Links appear in both desktop nav and mobile drawer, so there are 2 of each.
    expect(screen.getAllByRole("link", { name: "Dashboard" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Calendar sync" }).length).toBeGreaterThan(0);
  });

  it("places Report directly after Dashboard", () => {
    renderWithClient(<NavBar />);
    const labels = screen.getAllByRole("navigation")[0]?.querySelectorAll("a") ?? new NodeList();

    expect(Array.from(labels).map((a) => a.textContent)).toEqual([
      "Dashboard",
      "Report",
      "Requests",
      "Groups",
      "Calendar sync",
    ]);
  });

  it("shows the Support link only for a support admin", () => {
    supportAdminState.supportAdmin = true;
    try {
      renderWithClient(<NavBar />);
      expect(screen.getAllByRole("link", { name: "Support" }).length).toBeGreaterThan(0);
    } finally {
      supportAdminState.supportAdmin = false;
    }
  });

  it("hides the Support link for everyone else", () => {
    renderWithClient(<NavBar />);
    expect(screen.queryByRole("link", { name: "Support" })).not.toBeInTheDocument();
  });

  it("toggles the mobile menu button state", () => {
    renderWithClient(<NavBar />);
    const burger = screen.getByRole("button", { name: "Menu" });
    expect(burger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(burger);
    expect(burger).toHaveAttribute("aria-expanded", "true");
  });
});
