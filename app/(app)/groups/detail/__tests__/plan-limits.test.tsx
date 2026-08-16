import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import GroupDetailPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { BillingOverview } from "@/lib/api/billing";

const removeMemberMutate = vi.fn();

const group = {
  id: "g-1",
  organizationId: "org-1",
  groupName: "Platform",
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  workingDays: [1, 2, 3, 4, 5],
  managerUserId: "u-1",
  organization: null,
  // The page reads its permissions from the backend now, not from the member list.
  access: { canView: true, canAdmin: true, viaOrgAdmin: false, isMember: true },
};

let members: {
  id: string;
  userId: string;
  adminAccess: boolean;
  user: { name: string; initials: string; avatarColor: string };
  email: string;
  viewAccess: boolean;
  approverAccess: boolean;
  controlledUser: boolean;
  createdAt: string;
}[] = [];
let invites: unknown[] = [];
let billing: BillingOverview | undefined;

const makeMember = (userId: string, name: string) => ({
  id: `m-${userId}`,
  userId,
  email: `${userId}@northwind.co`,
  adminAccess: false,
  viewAccess: true,
  approverAccess: false,
  controlledUser: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  user: { name, initials: name.slice(0, 2).toUpperCase(), avatarColor: "#abc" },
});

const overviewFor = (orgId: string | null, maxMembers: number): BillingOverview => ({
  organization: orgId
    ? { id: orgId, name: "Acme", billingEmail: "a@b.co", hasPaddleCustomer: false }
    : null,
  subscription: null,
  entitlements: {
    plan: "FREE",
    maxGroups: 3,
    maxMembersPerGroup: maxMembers,
    writable: true,
    graceEndsAt: null,
  },
  usage: { groupsUsed: 1, groups: [] },
  planLimits: {
    FREE: { groups: 3, membersPerGroup: maxMembers, maxExtraSlots: 0 },
    PRO: { groups: 5, membersPerGroup: 25, maxExtraSlots: 4 },
    ENTERPRISE: { groups: 20, membersPerGroup: 100, maxExtraSlots: 20 },
  },
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ groupId: "g-1", tab: "invites" }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-1" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useGroup: () => ({ data: group, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: members, isLoading: false, error: null }),
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useSetUserQuota: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupQuotas: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupUsers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupWorkingDays: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroupInvites: () => ({ data: invites, isLoading: false, error: null }),
  useCreateGroupInvite: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeGroupInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useGroupMirrors: () => ({ data: undefined, isLoading: false, error: null }),
  useSetGroupMirrors: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: billing, isLoading: false, error: null }),
  useRemoveGroupUser: () => ({ mutateAsync: removeMemberMutate, isPending: false }),
}));

describe("GroupDetailPage plan limits", () => {
  beforeEach(() => {
    removeMemberMutate.mockReset().mockResolvedValue({});
    members = [makeMember("u-1", "Olivia Owner"), makeMember("u-2", "Alice Novak")];
    invites = [];
    billing = overviewFor("org-1", 10);
  });

  it("blocks the invite button once members plus open invites reach the cap", () => {
    billing = overviewFor("org-1", 2);
    invites = [{ id: "i-1", email: "sam@northwind.co", code: "ABC", expiresAt: "2030-01-01" }];

    renderWithClient(<GroupDetailPage />);

    expect(screen.getByRole("button", { name: "Send invite" })).toBeDisabled();
    expect(screen.getByText(/at its 2-member limit/i)).toBeInTheDocument();
  });

  it("leaves the gate open while seats remain", () => {
    // 2 members + 0 invites against a cap of 3 leaves room.
    billing = overviewFor("org-1", 3);
    renderWithClient(<GroupDetailPage />);
    expect(screen.queryByText(/member limit/i)).not.toBeInTheDocument();
  });

  it("applies no cap when the group belongs to another owner's organization", () => {
    // The viewer administers this group but does not own its billing org, so
    // their own Free entitlements say nothing about it. 2 members against a
    // cap of 1 would otherwise trip the gate.
    billing = overviewFor("org-OTHER", 1);

    renderWithClient(<GroupDetailPage />);

    expect(screen.queryByText(/member limit/i)).not.toBeInTheDocument();
  });

  it("applies no cap when the viewer owns no organization at all", () => {
    billing = overviewFor(null, 1);

    renderWithClient(<GroupDetailPage />);

    expect(screen.queryByText(/member limit/i)).not.toBeInTheDocument();
  });
});
