import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDetailPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const setMirrorsMutate = vi.fn();

const group = {
  id: "g-1",
  groupName: "All Engineering",
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  workingDays: [1, 2, 3, 4, 5],
  managerUserId: "u-1",
};

const dana = {
  userId: "u-2",
  user: { id: "u-2", name: "Dana Holt", initials: "DH", avatarColor: "hsl(0 0% 50%)" },
  email: "dana@example.com",
};

let mirrorsData: unknown;

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ groupId: "g-1", tab: "mirroring" }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-1" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: [group], isLoading: false, error: null }),
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useSetUserQuota: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupQuotas: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupUsers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupWorkingDays: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroupInvites: () => ({ data: [], isLoading: false, error: null }),
  useCreateGroupInvite: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeGroupInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useGroupMirrors: () => ({ data: mirrorsData, isLoading: false, error: null }),
  useSetGroupMirrors: () => ({ mutateAsync: setMirrorsMutate, isPending: false }),
}));

describe("GroupDetailPage mirroring tab — admin", () => {
  beforeEach(() => {
    setMirrorsMutate.mockReset().mockResolvedValue([]);
    mirrorsData = {
      groupId: "g-1",
      canManage: true,
      members: [
        {
          ...dana,
          candidates: [
            { groupId: "g-2", groupName: "Team A", mirrored: true, manageable: true },
            { groupId: "g-3", groupName: "Leadership", mirrored: false, manageable: true },
          ],
        },
      ],
    };
  });

  it("pre-selects the groups already mirrored into this one", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByRole("checkbox", { name: "Team A" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Leadership" })).not.toBeChecked();
  });

  it("names the member the sources belong to", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText("Dana Holt")).toBeInTheDocument();
    expect(screen.getByText("dana@example.com")).toBeInTheDocument();
  });

  it("saves the full set of source groups for that member after toggling one on", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("checkbox", { name: "Leadership" }));
    await user.click(screen.getByRole("button", { name: "Save mirroring" }));

    expect(setMirrorsMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      userId: "u-2",
      sourceGroupIds: ["g-2", "g-3"],
    });
  });

  it("turns mirroring off by saving an empty set", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("checkbox", { name: "Team A" }));
    await user.click(screen.getByRole("button", { name: "Save mirroring" }));

    expect(setMirrorsMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      userId: "u-2",
      sourceGroupIds: [],
    });
  });

  it("locks a source the admin does not administer, and leaves it out of the save", async () => {
    mirrorsData = {
      groupId: "g-1",
      canManage: true,
      members: [
        {
          ...dana,
          candidates: [
            { groupId: "g-2", groupName: "Team A", mirrored: true, manageable: true },
            { groupId: "g-9", groupName: "Hidden Team", mirrored: true, manageable: false },
          ],
        },
      ],
    };
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    const locked = screen.getByRole("checkbox", { name: /Hidden Team/ });
    expect(locked).toBeChecked();
    expect(locked).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "Team A" }));
    await user.click(screen.getByRole("button", { name: "Save mirroring" }));

    expect(setMirrorsMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      userId: "u-2",
      sourceGroupIds: [],
    });
  });

  it("explains that mirrored records stay owned by their source group", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText(/read-only here/i)).toBeInTheDocument();
  });

  it("says so when the admin shares no other group with the member", () => {
    mirrorsData = {
      groupId: "g-1",
      canManage: true,
      members: [{ ...dana, candidates: [] }],
    };
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText("No shared groups with this member.")).toBeInTheDocument();
  });
});

describe("GroupDetailPage mirroring tab — non-admin", () => {
  beforeEach(() => {
    setMirrorsMutate.mockReset().mockResolvedValue([]);
  });

  it("shows the caller's own mirrors read-only, with no way to change them", () => {
    mirrorsData = {
      groupId: "g-1",
      canManage: false,
      members: [
        {
          userId: "u-1",
          user: { id: "u-1", name: "Olivia", initials: "OL", avatarColor: "hsl(0 0% 50%)" },
          email: "olivia@example.com",
          candidates: [{ groupId: "g-2", groupName: "Team A", mirrored: true, manageable: false }],
        },
      ],
    };
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText("Team A")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save mirroring" })).not.toBeInTheDocument();
  });

  it("says so when none of their records are shown here", () => {
    mirrorsData = {
      groupId: "g-1",
      canManage: false,
      members: [
        {
          userId: "u-1",
          user: { id: "u-1", name: "Olivia", initials: "OL", avatarColor: "hsl(0 0% 50%)" },
          email: "olivia@example.com",
          candidates: [],
        },
      ],
    };
    renderWithClient(<GroupDetailPage />);

    expect(
      screen.getByText("None of your records from other groups are shown here.")
    ).toBeInTheDocument();
  });
});
