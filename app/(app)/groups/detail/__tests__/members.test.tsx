import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDetailPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const updateMembersMutate = vi.fn();

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

// Alice approves but administers nothing — the split the column exists to show.
const members = [
  {
    id: "gu-1",
    groupId: "g-1",
    userId: "u-1",
    viewAccess: true,
    adminAccess: true,
    approverAccess: false,
    controlledUser: true,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    email: "olivia@example.com",
    user: { id: "u-1", name: "Olivia Owner", initials: "OO", avatarColor: "hsl(0 0% 50%)" },
  },
  {
    id: "gu-2",
    groupId: "g-1",
    userId: "u-2",
    viewAccess: true,
    adminAccess: false,
    approverAccess: true,
    controlledUser: true,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    email: "alice@example.com",
    user: { id: "u-2", name: "Alice Novak", initials: "AN", avatarColor: "hsl(0 0% 50%)" },
  },
];

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ groupId: "g-1", tab: "members" }),
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
  useUpdateGroupUsers: () => ({ mutateAsync: updateMembersMutate, isPending: false }),
  useUpdateGroupWorkingDays: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroupInvites: () => ({ data: [], isLoading: false, error: null }),
  useCreateGroupInvite: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeGroupInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useGroupMirrors: () => ({ data: undefined, isLoading: false, error: null }),
  useSetGroupMirrors: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: undefined, isLoading: false, error: null }),
  useRemoveGroupUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

/** The permission cells of one member's row, in column order. */
const permCells = (name: string) => {
  const row = screen.getByText(name).closest("tr");
  return within(row!)
    .getAllByText(/^(Yes|No)$/)
    .map((el) => el.textContent);
};

describe("GroupDetailPage members tab", () => {
  beforeEach(() => {
    updateMembersMutate.mockReset().mockResolvedValue({});
  });

  it("shows Approver as its own column, separate from Admin", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByRole("columnheader", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Approver" })).toBeInTheDocument();

    // View, Admin, Approver, Tracked.
    expect(permCells("Olivia Owner")).toEqual(["Yes", "Yes", "No", "Yes"]);
    expect(permCells("Alice Novak")).toEqual(["Yes", "No", "Yes", "Yes"]);
  });

  it("saves approverAccess independently of adminAccess", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("button", { name: "Edit permissions" }));

    // Alice's Approver cell is the third toggle in her row.
    const aliceRow = screen.getByText("Alice Novak").closest("tr");
    const toggles = within(aliceRow!).getAllByRole("button");
    await user.click(toggles[2]!);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateMembersMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      data: [
        expect.objectContaining({ userId: "u-1", adminAccess: true, approverAccess: false }),
        expect.objectContaining({ userId: "u-2", adminAccess: false, approverAccess: false }),
      ],
    });
  });
});
