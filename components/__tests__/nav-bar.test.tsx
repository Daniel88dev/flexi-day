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

vi.mock("@/lib/api/queries", () => ({
  useNotifications: () => ({ data: [], isLoading: false, error: null }),
  useMarkNotificationRead: () => ({ mutate: vi.fn(), isPending: false }),
  useGroups: () => ({ data: [], isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("NavBar", () => {
  it("renders the primary navigation links", () => {
    renderWithClient(<NavBar />);
    // Links appear in both desktop nav and mobile drawer, so there are 2 of each.
    expect(screen.getAllByRole("link", { name: "Dashboard" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Calendar sync" }).length).toBeGreaterThan(0);
  });

  it("toggles the mobile menu button state", () => {
    renderWithClient(<NavBar />);
    const burger = screen.getByRole("button", { name: "Menu" });
    expect(burger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(burger);
    expect(burger).toHaveAttribute("aria-expanded", "true");
  });
});
