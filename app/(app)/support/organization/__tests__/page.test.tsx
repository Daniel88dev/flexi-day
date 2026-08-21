import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import SupportOrganizationPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const searchParamsState = { params: new URLSearchParams({ organizationId: "org-1" }) };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => searchParamsState.params,
}));

vi.mock("@/lib/support/use-support-admin", () => ({
  useSupportAdmin: () => ({ supportAdmin: true, isPending: false }),
}));

vi.mock("@/lib/api/queries", () => ({
  useSupportOrganization: () => ({
    data: {
      organization: {
        id: "org-1",
        name: "Acme",
        billingEmail: "billing@example.com",
        paddleCustomerId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      owner: { userId: "u-1", name: "Owner", email: "owner@example.com" },
      plan: {
        plan: "PRO",
        status: "active",
        maxGroups: 5,
        maxMembersPerGroup: 25,
        writable: true,
        graceEndsAt: null,
      },
      groups: [
        {
          id: "g-1",
          groupName: "Platform",
          managerUserId: "u-1",
          members: 3,
          deletedAt: "2026-03-01T00:00:00.000Z",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      admins: [{ userId: "u-1", email: "owner@example.com", isOwner: true, grantedAt: null }],
    },
    isLoading: false,
    error: null,
  }),
}));

describe("SupportOrganizationPage", () => {
  it("explains a missing organizationId instead of loading forever", () => {
    searchParamsState.params = new URLSearchParams();
    try {
      renderWithClient(<SupportOrganizationPage />);
      expect(screen.getByText(/No organization id/)).toBeInTheDocument();
      expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    } finally {
      searchParamsState.params = new URLSearchParams({ organizationId: "org-1" });
    }
  });

  it("renders the organization with plan, deleted groups and admins", () => {
    renderWithClient(<SupportOrganizationPage />);
    expect(screen.getByRole("heading", { name: "Acme" })).toBeInTheDocument();
    expect(screen.getByText(/PRO/)).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    // Deleted groups stay listed, flagged rather than hidden.
    expect(screen.getByText(/deleted/)).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
  });
});
