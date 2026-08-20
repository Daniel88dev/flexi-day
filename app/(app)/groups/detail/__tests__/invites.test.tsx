import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDetailPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const createInviteMutate = vi.fn();
const revokeInviteMutate = vi.fn();

const group = {
  id: "g-1",
  groupName: "Platform",
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  workingDays: [1, 2, 3, 4, 5],
  managerUserId: "u-1",
  organization: null,
  // The page reads its permissions from the backend now, not from the member list.
  access: { canView: true, canAdmin: true, viaOrgAdmin: false, isMember: true },
};

let members: { userId: string; adminAccess: boolean }[] = [];
let invites: unknown[] = [];

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ groupId: "g-1", tab: "invites" }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-1" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useBankHolidayCountries: () => ({ data: [], isLoading: false, error: null }),
  useUpdateGroupHolidayCountry: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroup: () => ({ data: group, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: members, isLoading: false, error: null }),
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useSetUserQuota: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupQuotas: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupUsers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupWorkingDays: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroupInvites: () => ({ data: invites, isLoading: false, error: null }),
  useCreateGroupInvite: () => ({ mutateAsync: createInviteMutate, isPending: false }),
  useRevokeGroupInvite: () => ({ mutate: revokeInviteMutate, isPending: false }),
  useGroupMirrors: () => ({ data: undefined, isLoading: false, error: null }),
  useSetGroupMirrors: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: undefined, isLoading: false, error: null }),
  useRemoveGroupUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("GroupDetailPage invites tab", () => {
  beforeEach(() => {
    createInviteMutate.mockReset().mockResolvedValue({ emailDelivered: true });
    revokeInviteMutate.mockReset();
    members = [];
    invites = [];
  });

  it("sends an invite for the entered email", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.type(screen.getByLabelText("Email address"), "sam@northwind.co");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(createInviteMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      email: "sam@northwind.co",
    });
    expect(await screen.findByText("Invite sent to sam@northwind.co.")).toBeInTheDocument();
  });

  it("tells the admin to share the code when the email could not be sent", async () => {
    createInviteMutate.mockResolvedValue({ emailDelivered: false });
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.type(screen.getByLabelText("Email address"), "sam@northwind.co");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(await screen.findByText(/the email could not be sent/i)).toBeInTheDocument();
  });

  it("lists outstanding invites with their code and revokes one", async () => {
    invites = [
      {
        id: "i-1",
        groupId: "g-1",
        code: "ABCD-EFGH-JKMN",
        email: "sam@northwind.co",
        expiresAt: "2026-09-01T00:00:00.000Z",
      },
    ];
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText("sam@northwind.co")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ABCD-EFGH-JKMN" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    expect(revokeInviteMutate).toHaveBeenCalledWith("i-1");
  });

  it("hides the invites tab entirely from non-admins", () => {
    // A plain member: view access, no administration from either a membership
    // or the organization.
    group.access = { canView: true, canAdmin: false, viaOrgAdmin: false, isMember: true };
    members = [{ userId: "u-1", adminAccess: false }];

    renderWithClient(<GroupDetailPage />);

    expect(screen.queryByRole("button", { name: "Invites" })).not.toBeInTheDocument();
    group.access = { canView: true, canAdmin: true, viaOrgAdmin: false, isMember: true };
  });
});
