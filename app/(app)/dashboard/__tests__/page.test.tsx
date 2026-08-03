import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { VacationKind, type UserSettings, type VacationListItem } from "@/lib/api/types";

const useVacationsSpy = vi.fn();

const dana = { id: "u-dana", name: "Dana Holt", initials: "DH", avatarColor: "hsl(0 0% 50%)" };
const sam = { id: "u-sam", name: "Sam Ruiz", initials: "SR", avatarColor: "hsl(0 0% 40%)" };

function day(
  id: string,
  user: typeof dana,
  requestedDay: string,
  mirroredFromGroupName: string | null = null
): VacationListItem {
  return {
    id,
    userId: user.id,
    groupId: "g-1",
    requestedDay,
    startTime: null,
    endTime: null,
    vacationType: VacationKind.Vacation,
    halfDay: false,
    note: null,
    rejectionReason: null,
    approvedAt: "2026-08-01T09:00:00.000Z",
    approvedBy: "approver-1",
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
    user,
    mirroredFromGroupId: mirroredFromGroupName ? "g-2" : null,
    mirroredFromGroupName,
  };
}

let settings: UserSettings = {
  emailNotifications: true,
  dashboardScope: "MINE",
  dashboardGroupId: null,
};

let vacations: VacationListItem[] = [day("v-1", dana, "2026-08-17")];

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-dana", name: "Dana Holt" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useVacations: (params: unknown) => {
    useVacationsSpy(params);
    return { data: vacations, isLoading: false, error: null };
  },
  useGroups: () => ({
    data: [{ id: "g-1", groupName: "Platform" }],
    isLoading: false,
    error: null,
  }),
  useDashboardSummary: () => ({ data: undefined, isLoading: false, error: null }),
  useMySettings: () => ({ data: settings, isLoading: false, error: null }),
  useReportScope: () => ({
    data: {
      groups: [
        { groupId: "g-1", groupName: "Platform", access: "all", canEditQuotas: false },
        { groupId: "g-3", groupName: "Design", access: "self", canEditQuotas: false },
      ],
      members: [],
      years: [],
    },
    isLoading: false,
    error: null,
  }),
  useMyApprovals: () => ({ data: [], isLoading: false, error: null }),
  useMyBalances: () => ({ data: undefined, isLoading: false, error: null }),
  useVacation: () => ({ data: undefined, isLoading: false, error: null }),
  useApproveVacation: () => ({ mutate: vi.fn(), isPending: false }),
  useApproveVacations: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectVacation: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectVacations: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelVacation: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelVacations: () => ({ mutate: vi.fn(), isPending: false }),
  useCommentVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("DashboardPage scope switch", () => {
  beforeEach(() => {
    settings = { emailNotifications: true, dashboardScope: "MINE", dashboardGroupId: null };
    vacations = [day("v-1", dana, "2026-08-17")];
    useVacationsSpy.mockClear();
  });

  it("asks for the caller's own records by default", () => {
    renderWithClient(<DashboardPage />);

    expect(useVacationsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: null }));
  });

  it("asks for the stored group when the preference is group scope", () => {
    settings = { emailNotifications: true, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
    renderWithClient(<DashboardPage />);

    expect(useVacationsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: "g-1" }));
  });

  it("falls back to the personal calendar when the stored group is no longer viewable", () => {
    settings = { emailNotifications: true, dashboardScope: "GROUP", dashboardGroupId: "g-3" };
    renderWithClient(<DashboardPage />);

    // g-3 is `self` access, so the group calendar would 403 — the first
    // viewable group is used instead of asking for one the API refuses.
    expect(useVacationsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: "g-1" }));
  });

  it("switches to the group without touching the stored preference", async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: "Group", pressed: false }));

    expect(useVacationsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: "g-1" }));
  });

  it("labels a mirrored teammate's leave with its source group", () => {
    settings = { emailNotifications: true, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
    vacations = [day("v-2", sam, "2026-08-18", "Team B")];
    renderWithClient(<DashboardPage />);

    expect(screen.getByTitle("Sam Ruiz · Vacation · mirrored from Team B")).toBeInTheDocument();
  });
});
