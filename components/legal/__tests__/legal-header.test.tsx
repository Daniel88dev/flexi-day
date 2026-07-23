import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { LegalHeader } from "../legal-header";
import { renderWithClient } from "@/lib/test-utils";

let sessionState: { data: unknown; isPending: boolean } = { data: null, isPending: false };

vi.mock("next/navigation", () => ({
  usePathname: () => "/privacy",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => sessionState,
  authClient: { signOut: vi.fn() },
}));

vi.mock("@/lib/api/queries", () => ({
  useNotifications: () => ({ data: [], isLoading: false, error: null }),
  useMarkNotificationRead: () => ({ mutate: vi.fn(), isPending: false }),
  useGroups: () => ({ data: [], isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("LegalHeader", () => {
  beforeEach(() => {
    sessionState = { data: null, isPending: false };
  });

  it("shows the sign-in header for visitors", () => {
    renderWithClient(<LegalHeader />);

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("shows the app navigation for a signed-in reader", () => {
    sessionState = {
      data: { user: { name: "Dana H", email: "dana@northwind.co" } },
      isPending: false,
    };

    renderWithClient(<LegalHeader />);

    expect(screen.getAllByRole("link", { name: "Dashboard" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("falls back to the visitor header while the session is resolving", () => {
    sessionState = { data: null, isPending: true };

    renderWithClient(<LegalHeader />);

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });
});
