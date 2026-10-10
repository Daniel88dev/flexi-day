import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { formatIsoDate, gridYears, isoDate } from "@/lib/calendar/month-grid";
import {
  CalendarRecordType,
  type BankHoliday,
  type UserSettings,
  type VacationListItem,
} from "@/lib/api/types";

const useVacationsSpy = vi.fn();
const useVacationCalendarSpy = vi.fn();
const useBankHolidaysMultiSpy = vi.fn();

let bankHolidayRows: BankHoliday[] = [];

const dana = { id: "u-dana", name: "Dana Holt", initials: "DH", avatarColor: "hsl(0 0% 50%)" };
const sam = { id: "u-sam", name: "Sam Ruiz", initials: "SR", avatarColor: "hsl(0 0% 40%)" };

// The calendar places records by date, so they must fall in the month it opens on.
const now = new Date();
const inVisibleMonth = (dayOfMonth: number) =>
  isoDate(now.getFullYear(), now.getMonth() + 1, dayOfMonth);

const gridYearsNow = () => gridYears(now.getFullYear(), now.getMonth() + 1);
const createLabel15 = `Create request for ${formatIsoDate(inVisibleMonth(15), "en-GB", {
  day: "numeric",
  month: "long",
})}`;

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
    requestId: "r-1",
    requestedDay,
    startTime: null,
    endTime: null,
    vacationType: CalendarRecordType.Vacation,
    halfDay: false,
    note: null,
    rejectionReason: null,
    approvedAt: "2026-08-01T09:00:00.000Z",
    approvedBy: "approver-1",
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    deletedByUserId: null,
    createdByUserId: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
    canApprove: false,
    user,
    mirroredFromGroupId: mirroredFromGroupName ? "g-2" : null,
    mirroredFromGroupName,
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  dashboardScope: "MINE",
  dashboardGroupId: null,
  dashboardCalendarView: "LANES",
  attendanceLocationNoticeDismissed: false,
};

let settings: UserSettings | undefined = DEFAULT_SETTINGS;

let vacations: VacationListItem[] = [day("v-1", dana, inVisibleMonth(17))];

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
  useVacationCalendar: (params: unknown) => {
    useVacationCalendarSpy(params);
    return { data: vacations, isLoading: false, error: null };
  },
  useGroups: () => ({
    data: [
      { id: "g-1", groupName: "Platform", holidayCountry: "CZ" },
      { id: "g-2", groupName: "Ops", holidayCountry: "DE" },
      { id: "g-4", groupName: "Sales", holidayCountry: "CZ" },
    ],
    isLoading: false,
    error: null,
  }),
  useGroup: () => ({ data: undefined, isLoading: false, error: null }),
  useUploadAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBankHolidaysMulti: (years: number[], countries: string[]) => {
    useBankHolidaysMultiSpy(years, countries);
    return bankHolidayRows;
  },
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),

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
  useCancelVacations: () => ({ mutate: vi.fn(), isPending: false }),
  useCommentVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("DashboardPage scope switch", () => {
  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "MINE", dashboardGroupId: null };
    vacations = [day("v-1", dana, inVisibleMonth(17))];
    useVacationsSpy.mockClear();
    useVacationCalendarSpy.mockClear();
  });

  it("asks for the caller's own records by default", () => {
    renderWithClient(<DashboardPage />);

    expect(useVacationCalendarSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ groupId: null })
    );
  });

  it("asks for the stored group when the preference is group scope", () => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
    renderWithClient(<DashboardPage />);

    expect(useVacationCalendarSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ groupId: "g-1" })
    );
  });

  it("falls back to the personal calendar when the stored group is no longer viewable", () => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "GROUP", dashboardGroupId: "g-3" };
    renderWithClient(<DashboardPage />);

    // g-3 is `self` access, so the group calendar would 403 — the first
    // viewable group is used instead of asking for one the API refuses.
    expect(useVacationCalendarSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ groupId: "g-1" })
    );
  });

  it("switches to the group without touching the stored preference", async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: "Group", pressed: false }));

    expect(useVacationCalendarSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ groupId: "g-1" })
    );
  });

  it("keeps Out today on the month-only list for the same month and scope", () => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
    renderWithClient(<DashboardPage />);

    const visible = { year: now.getFullYear(), month: now.getMonth() + 1, groupId: "g-1" };
    expect(useVacationCalendarSpy).toHaveBeenLastCalledWith(visible);
    expect(useVacationsSpy).toHaveBeenLastCalledWith(visible);
  });

  it("labels a mirrored teammate's leave with its source group", () => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
    vacations = [day("v-2", sam, inVisibleMonth(18), "Team B")];
    renderWithClient(<DashboardPage />);

    expect(screen.getByTitle("Sam Ruiz · Vacation · mirrored from Team B")).toBeInTheDocument();
  });

  it("keeps a pending half day apart from the approved day before it", () => {
    vacations = [
      day("v-1", dana, inVisibleMonth(17)),
      {
        ...day("v-2", dana, inVisibleMonth(18)),
        approvedAt: null,
        approvedBy: null,
        halfDay: true,
      },
    ];
    renderWithClient(<DashboardPage />);

    expect(screen.getByTitle("Dana Holt · Vacation")).toBeInTheDocument();
    expect(screen.getByTitle("Dana Holt · Vacation · Pending")).toHaveTextContent("Dana ½");
  });
});

describe("DashboardPage bank holidays", () => {
  const visibleMonthDate = inVisibleMonth(15);

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "MINE", dashboardGroupId: null };
    vacations = [];
    bankHolidayRows = [];
    useBankHolidaysMultiSpy.mockClear();
  });

  it("requests the distinct holiday countries of the caller's groups in MINE scope", () => {
    renderWithClient(<DashboardPage />);

    // g-1 and g-4 are both CZ; the page dedupes before fetching.
    expect(useBankHolidaysMultiSpy).toHaveBeenLastCalledWith(gridYearsNow(), ["CZ", "DE"]);
  });

  it("renders a holiday from the visible month as a calendar pill", () => {
    bankHolidayRows = [{ date: visibleMonthDate, name: "State Holiday", country: "CZ" }];
    renderWithClient(<DashboardPage />);

    expect(screen.getByText(/State Holiday/)).toBeInTheDocument();
  });

  it("ignores holidays outside the visible month", () => {
    bankHolidayRows = [{ date: "1999-01-01", name: "Old Holiday", country: "CZ" }];
    renderWithClient(<DashboardPage />);

    expect(screen.queryByText(/Old Holiday/)).not.toBeInTheDocument();
  });

  it("adds the next year's holidays once December's grid reaches into January", async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    for (let m = now.getMonth() + 1; m < 12; m++) {
      await user.click(screen.getByRole("button", { name: "Next month" }));
    }

    expect(useBankHolidaysMultiSpy).toHaveBeenLastCalledWith(
      [now.getFullYear(), now.getFullYear() + 1],
      ["CZ", "DE"]
    );
  });

  it("shows a next-year holiday on December's trailing days", async () => {
    const user = userEvent.setup();
    bankHolidayRows = [
      { date: `${now.getFullYear() + 1}-01-01`, name: "New Year Holiday", country: "CZ" },
    ];
    renderWithClient(<DashboardPage />);

    for (let m = now.getMonth() + 1; m < 12; m++) {
      await user.click(screen.getByRole("button", { name: "Next month" }));
    }

    expect(screen.getByText(/New Year Holiday/)).toBeInTheDocument();
  });

  it("uses only the selected group's country from the membership list in GROUP scope", () => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
    renderWithClient(<DashboardPage />);

    // g-1 is in the mocked useGroups list with CZ — no detail fetch, and the
    // other memberships' countries (DE) must not leak into GROUP scope.
    expect(useBankHolidaysMultiSpy).toHaveBeenLastCalledWith(gridYearsNow(), ["CZ"]);
  });
});

describe("DashboardPage calendar view", () => {
  beforeEach(() => {
    settings = DEFAULT_SETTINGS;
    vacations = [];
  });

  it("shows the lanes calendar when the stored view is Lanes", () => {
    renderWithClient(<DashboardPage />);

    expect(screen.getByRole("button", { name: createLabel15 })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^\w+,? 15 \w+$/ })).not.toBeInTheDocument();
  });

  it("shows the lanes calendar while settings are still loading", () => {
    settings = undefined;
    renderWithClient(<DashboardPage />);

    expect(screen.getByRole("button", { name: createLabel15 })).toBeInTheDocument();
  });

  it("shows the stripes calendar when the stored view is Stripes", () => {
    settings = { ...DEFAULT_SETTINGS, dashboardCalendarView: "STRIPES" };
    renderWithClient(<DashboardPage />);

    expect(screen.queryByRole("button", { name: /Create request for/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^\w+,? 15 \w+$/ })).toBeInTheDocument();
  });
});
