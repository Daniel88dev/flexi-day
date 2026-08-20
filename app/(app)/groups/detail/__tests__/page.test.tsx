import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDetailPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const updateWorkingDaysMutate = vi.fn().mockResolvedValue({});

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

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ groupId: "g-1", tab: "quotas" }),
}));

vi.mock("@/lib/auth-client", () => ({
  // The manager is an admin, so the working-days card renders.
  useSession: () => ({ data: { user: { id: "u-1" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useBankHolidayCountries: () => ({ data: [], isLoading: false, error: null }),
  useUpdateGroupHolidayCountry: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroup: () => ({ data: group, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useSetUserQuota: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupQuotas: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupUsers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupWorkingDays: () => ({ mutateAsync: updateWorkingDaysMutate, isPending: false }),
  useGroupInvites: () => ({ data: [], isLoading: false, error: null }),
  useCreateGroupInvite: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeGroupInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useGroupMirrors: () => ({ data: undefined, isLoading: false, error: null }),
  useSetGroupMirrors: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: undefined, isLoading: false, error: null }),
  useRemoveGroupUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("GroupDetailPage working days", () => {
  beforeEach(() => {
    updateWorkingDaysMutate.mockClear();
    group.workingDays = [1, 2, 3, 4, 5];
  });

  it("renders a toggle for every weekday, pre-selecting the group's working days", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText("Working days")).toBeInTheDocument();
    for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sat" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Sun" })).toHaveAttribute("aria-pressed", "false");
  });

  it("saves the stored weekday numbers after toggling Saturday on", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("button", { name: "Sat" }));
    await user.click(screen.getByRole("button", { name: "Save working days" }));

    // Saturday is Date.getDay() === 6, appended to the existing Mon-Fri set.
    expect(updateWorkingDaysMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      workingDays: [1, 2, 3, 4, 5, 6],
    });
  });

  it("blocks saving when no working day is selected", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      await user.click(screen.getByRole("button", { name: label }));
    }
    await user.click(screen.getByRole("button", { name: "Save working days" }));

    expect(updateWorkingDaysMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Select at least one working day.")).toBeInTheDocument();
  });
});
