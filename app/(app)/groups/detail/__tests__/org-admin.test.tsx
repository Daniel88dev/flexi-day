import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import GroupDetailPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { GroupAccess } from "@/lib/api/types";

const group = {
  id: "g-1",
  groupName: "Platform",
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  workingDays: [1, 2, 3, 4, 5],
  managerUserId: "someone-else",
  organization: {
    id: "org-1",
    name: "Acme",
    plan: "PRO" as const,
    status: "active" as const,
    active: true,
  },
  access: {} as GroupAccess,
};

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ groupId: "g-1", tab: "members" }),
}));

vi.mock("@/lib/api/queries", () => ({
  useGroup: () => ({ data: group, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useSetUserQuota: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupQuotas: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupUsers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupWorkingDays: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroupInvites: () => ({ data: [], isLoading: false, error: null }),
  useCreateGroupInvite: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeGroupInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useGroupMirrors: () => ({ data: undefined, isLoading: false, error: null }),
  useSetGroupMirrors: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: undefined, isLoading: false, error: null }),
  useRemoveGroupUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

/**
 * The case the feature exists for: someone administering the group through the
 * organization, with no membership row anywhere in it.
 */
describe("GroupDetailPage as an organization admin", () => {
  beforeEach(() => {
    group.access = { canView: true, canAdmin: true, viaOrgAdmin: true, isMember: false };
  });

  it("gives them the admin surface despite no membership", () => {
    renderWithClient(<GroupDetailPage />);
    expect(screen.getByRole("button", { name: "Invites" })).toBeInTheDocument();
  });

  it("tells them they are acting for the organization", () => {
    renderWithClient(<GroupDetailPage />);
    expect(screen.getByText(/administrator of Acme/i)).toBeInTheDocument();
  });

  it("shows the organization badge", () => {
    renderWithClient(<GroupDetailPage />);
    expect(screen.getByText("Acme · Pro")).toBeInTheDocument();
  });

  it("stays silent for a member whose admin rights happen to come from the org", () => {
    // The backend reports viaOrgAdmin for any non-membership admin authority,
    // including one held by an actual member — telling them they are not a
    // member would be flatly wrong.
    group.access = { canView: true, canAdmin: true, viaOrgAdmin: true, isMember: true };

    renderWithClient(<GroupDetailPage />);

    expect(screen.queryByText(/administrator of Acme/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invites" })).toBeInTheDocument();
  });

  it("hides the admin surface when the org grants only viewing", () => {
    group.access = { canView: true, canAdmin: false, viaOrgAdmin: false, isMember: true };

    renderWithClient(<GroupDetailPage />);

    expect(screen.queryByRole("button", { name: "Invites" })).not.toBeInTheDocument();
    expect(screen.queryByText(/administrator of Acme/i)).not.toBeInTheDocument();
  });
});
