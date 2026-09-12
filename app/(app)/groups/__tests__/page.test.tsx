import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import GroupsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { BillingOverview } from "@/lib/api/billing";

const groups = [
  {
    id: "g-1",
    organizationId: "org-1",
    organization: null,
    groupName: "Platform",
    defaultVacationDays: 25,
    defaultHomeOfficeDays: 150,
    workingDays: [1, 2, 3, 4, 5],
    holidayCountry: null,
    managerUserId: "u-1",
    mainApprovalUser: null,
    tempApprovalUser: null,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    memberCount: 3,
    membership: { adminAccess: true, approverAccess: true },
  },
];

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-1" } } }),
}));

let billing: BillingOverview | undefined;

const overviewAs = (isOwner: boolean, groupsUsed = 1): BillingOverview => ({
  organization: {
    id: "org-1",
    name: "Acme",
    isOwner,
    billingEmail: isOwner ? "a@b.co" : null,
    hasPaddleCustomer: false,
  },
  subscription: null,
  entitlements: {
    plan: "PRO",
    maxGroups: 5,
    maxMembersPerGroup: 25,
    writable: true,
    graceEndsAt: null,
  },
  usage: { groupsUsed, activeEmployments: 1, groups: [] },
  planLimits: {
    FREE: { groups: 3, membersPerGroup: 10, maxExtraSlots: 0 },
    PRO: { groups: 5, membersPerGroup: 25, maxExtraSlots: 4 },
    ENTERPRISE: { groups: 20, membersPerGroup: 100, maxExtraSlots: 20 },
  },
});

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: groups, isLoading: false, error: null }),
  useCreateGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJoinGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: billing, isLoading: false, error: null }),
}));

describe("GroupsPage", () => {
  beforeEach(() => {
    billing = undefined;
  });

  it("renders the create and join cards and the group list", () => {
    renderWithClient(<GroupsPage />);

    expect(screen.getByText("Create a group")).toBeInTheDocument();
    expect(screen.getByText("Join with code")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Platform" })).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("shows the owner their own group allowance", () => {
    billing = overviewAs(true);
    renderWithClient(<GroupsPage />);

    expect(screen.getByText("1 of 5 groups used")).toBeInTheDocument();
  });

  it("blocks the owner at their group cap", () => {
    billing = overviewAs(true, 5);
    renderWithClient(<GroupsPage />);

    expect(screen.getByRole("link", { name: /Upgrade/ })).toBeInTheDocument();
  });

  it("applies neither the allowance nor the cap to a delegated admin", () => {
    // A new group lands in the creator's own organization, so the administered
    // org's usage says nothing about what they may create here — least of all
    // that they are out of room.
    billing = overviewAs(false, 5);
    renderWithClient(<GroupsPage />);

    expect(screen.queryByText(/groups used/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Upgrade/ })).not.toBeInTheDocument();
  });
});
