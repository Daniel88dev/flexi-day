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

describe("GroupDetailPage mirroring tab", () => {
  beforeEach(() => {
    setMirrorsMutate.mockReset().mockResolvedValue([]);
    mirrorsData = {
      groupId: "g-1",
      candidates: [
        { groupId: "g-2", groupName: "Team A", mirrored: true },
        { groupId: "g-3", groupName: "Leadership", mirrored: false },
      ],
    };
  });

  it("pre-selects the groups already mirrored into this one", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByRole("checkbox", { name: "Team A" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Leadership" })).not.toBeChecked();
  });

  it("saves the full set of source groups after toggling one on", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("checkbox", { name: "Leadership" }));
    await user.click(screen.getByRole("button", { name: "Save mirroring" }));

    expect(setMirrorsMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      sourceGroupIds: ["g-2", "g-3"],
    });
  });

  it("turns mirroring off by saving an empty set", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("checkbox", { name: "Team A" }));
    await user.click(screen.getByRole("button", { name: "Save mirroring" }));

    expect(setMirrorsMutate).toHaveBeenCalledWith({ groupId: "g-1", sourceGroupIds: [] });
  });

  it("explains that mirrored records stay owned by their source group", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText(/read-only here/i)).toBeInTheDocument();
  });

  it("says so when the user has no other group to mirror from", () => {
    mirrorsData = { groupId: "g-1", candidates: [] };
    renderWithClient(<GroupDetailPage />);

    expect(
      screen.getByText("You are not in any other group to mirror from.")
    ).toBeInTheDocument();
  });
});
