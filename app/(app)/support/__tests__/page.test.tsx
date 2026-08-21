import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import SupportPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const supportAdminState = { supportAdmin: true, isPending: false };
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/support/use-support-admin", () => ({
  useSupportAdmin: () => supportAdminState,
}));

vi.mock("@/lib/api/queries", () => ({
  useSupportOrganizations: () => ({
    data: {
      organizations: [
        {
          id: "org-1",
          name: "Acme",
          ownerUserId: "u-1",
          ownerName: "Owner",
          ownerEmail: "owner@example.com",
          liveGroups: 2,
          plan: "PRO",
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

describe("SupportPage", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    supportAdminState.supportAdmin = true;
    supportAdminState.isPending = false;
  });

  it("renders the organization search results for a support admin", () => {
    renderWithClient(<SupportPage />);
    expect(screen.getByRole("heading", { name: "Support" })).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText(/owner@example.com/)).toBeInTheDocument();
  });

  it("renders nothing and redirects for a non-admin", () => {
    supportAdminState.supportAdmin = false;
    renderWithClient(<SupportPage />);
    expect(screen.queryByRole("heading", { name: "Support" })).not.toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
  });

  it("does not redirect while the session is still loading", () => {
    supportAdminState.supportAdmin = false;
    supportAdminState.isPending = true;
    renderWithClient(<SupportPage />);
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
