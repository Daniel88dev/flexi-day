import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import { formatIsoDate, gridYears, isoDate } from "@/lib/calendar/month-grid";
import {
  AWAY_RECORD_TYPE,
  CalendarRecordType,
  type BankHoliday,
  type UserSettings,
  type VacationListItem,
} from "@/lib/api/types";
import type { BirthdayCalendarRow } from "@/lib/api/birthdays";
import type { GroupEventGroup, GroupEventRow } from "@/lib/api/group-events";
import {
  closeGroupEventSheet,
  groupEventSheetState,
  shownGroupEventGroup,
} from "@/lib/group-events/sheet-store";

const useVacationsSpy = vi.fn();
const useVacationCalendarSpy = vi.fn();
const useBankHolidaysMultiSpy = vi.fn();
const useBirthdaysSpy = vi.fn();
const useGroupEventsSpy = vi.fn();

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

let calendarError: unknown = null;

let birthdayRows: BirthdayCalendarRow[] = [];

let groupEventRows: GroupEventRow[] = [];

let groupEventGroups: GroupEventGroup[] = [];

let searchParams = new URLSearchParams();
const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/",
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-dana", name: "Dana Holt" } } }),
}));

vi.mock("@/lib/viewer/use-viewer-roles", () => ({
  useViewerRoles: () => ({ isLoading: false, isApprover: false }),
}));

vi.mock("@/lib/api/queries", () => ({
  useVacations: (params: unknown) => {
    useVacationsSpy(params);
    return { data: vacations, isLoading: false, error: null };
  },
  useVacationCalendar: (params: unknown) => {
    useVacationCalendarSpy(params);
    return { data: calendarError ? undefined : vacations, isLoading: false, error: calendarError };
  },
  useBirthdays: (params: unknown) => {
    useBirthdaysSpy(params);
    return { data: birthdayRows, isLoading: false, error: null };
  },
  useGroupEvents: (params: unknown) => {
    useGroupEventsSpy(params);
    return { data: groupEventRows, isLoading: false, error: null };
  },
  useGroupEventGroups: () => ({ data: groupEventGroups, isLoading: false, error: null }),
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
  useMyPendingRequests: () => ({ data: [], isLoading: false, error: null }),
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

describe("DashboardPage calendar refusal", () => {
  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
  });

  afterEach(() => {
    calendarError = null;
  });

  it("explains a refused group without claiming access was lost", () => {
    calendarError = new ApiError(403, "No access to view this group's records");
    renderWithClient(<DashboardPage />);

    expect(screen.getByText("You don't have access to this group's time off.")).toBeInTheDocument();
    expect(screen.queryByText(/no longer/i)).not.toBeInTheDocument();
    expect(screen.queryByText("No access to view this group's records")).not.toBeInTheDocument();
  });

  it("shows its own copy rather than the backend's message on any other failure", () => {
    calendarError = new ApiError(500, "Internal Server Error");
    renderWithClient(<DashboardPage />);

    expect(
      screen.getByText("Could not load the calendar. Try again in a moment.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Internal Server Error")).not.toBeInTheDocument();
  });
});

describe("DashboardPage calendar link", () => {
  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "MINE", dashboardGroupId: null };
    useVacationCalendarSpy.mockClear();
    routerReplace.mockClear();
  });
  afterEach(() => {
    searchParams = new URLSearchParams();
  });

  it("lands in Group scope on the linked group and month, then drops the link", () => {
    searchParams = new URLSearchParams("groupId=g-1&month=2027-02");
    renderWithClient(<DashboardPage />);

    expect(useVacationCalendarSpy).toHaveBeenLastCalledWith({
      year: 2027,
      month: 2,
      groupId: "g-1",
    });
    expect(screen.getByRole("heading", { name: "February 2027" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Group", pressed: true })).toBeInTheDocument();
    expect(routerReplace).toHaveBeenCalledWith("/dashboard/", { scroll: false });
  });

  it("leaves the URL alone without a link", () => {
    renderWithClient(<DashboardPage />);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("reports the group it shows to the header until it leaves", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithClient(<DashboardPage />);
    expect(shownGroupEventGroup()).toBeNull();

    await user.click(screen.getByRole("button", { name: "Group", pressed: false }));
    expect(shownGroupEventGroup()).toBe("g-1");

    unmount();
    expect(shownGroupEventGroup()).toBeNull();
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

describe("DashboardPage birthdays", () => {
  const dayLabel = (d: number) =>
    formatIsoDate(inVisibleMonth(d), "en-GB", { day: "numeric", month: "long" });

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "MINE", dashboardGroupId: null };
    vacations = [];
    birthdayRows = [];
    useBirthdaysSpy.mockClear();
  });

  it("asks only for the viewer's own birthday in Mine scope", () => {
    renderWithClient(<DashboardPage />);

    expect(useBirthdaysSpy).toHaveBeenLastCalledWith({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      groupId: null,
    });
  });

  it("asks for the group's birthdays in Group scope", async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: "Group", pressed: false }));

    expect(useBirthdaysSpy).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: "g-1" }));
  });

  it("puts the viewer's birthday on its day, linked to Settings", async () => {
    const user = userEvent.setup();
    birthdayRows = [
      {
        userId: dana.id,
        user: dana,
        date: inVisibleMonth(20),
        month: now.getMonth() + 1,
        day: 20,
        year: 1988,
        age: 38,
      },
    ];
    renderWithClient(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: `1 birthday on ${dayLabel(20)}` }));

    expect(screen.getByRole("link", { name: /Your birthday · 38/ })).toHaveAttribute(
      "href",
      "/settings"
    );
  });
});

describe("DashboardPage group events", () => {
  const dayLabel = (d: number) =>
    formatIsoDate(inVisibleMonth(d), "en-GB", { day: "numeric", month: "long" });

  const retro: GroupEventRow = {
    id: "ge-1",
    groupId: "g-1",
    groupName: "Platform",
    title: "Retro",
    note: null,
    startDate: inVisibleMonth(14),
    endDate: inVisibleMonth(14),
    startTime: "14:00",
    endTime: "15:00",
    repeat: null,
    skippedDates: [],
    recurringEventId: null,
    originalDate: null,
    createdBy: sam,
    canEdit: false,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  };

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "MINE", dashboardGroupId: null };
    vacations = [];
    birthdayRows = [];
    groupEventRows = [retro];
    useGroupEventsSpy.mockClear();
  });

  it("asks for every group's events in Mine scope and names each card's group", async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    expect(useGroupEventsSpy).toHaveBeenLastCalledWith({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      groupId: null,
    });
    await user.click(screen.getByRole("button", { name: `1 group event on ${dayLabel(14)}` }));
    expect(screen.getByText("Platform")).toBeVisible();
    expect(screen.getByText("Only Sam or a group admin can change this")).toBeVisible();
  });

  it("asks for the group's events in Group scope, without naming the group on cards", async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: "Group", pressed: false }));
    expect(useGroupEventsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: "g-1" }));

    await user.click(screen.getByRole("button", { name: `1 group event on ${dayLabel(14)}` }));
    expect(screen.getByText("Added by Sam Ruiz")).toBeVisible();
    expect(screen.queryByText("Platform", { selector: "span" })).not.toBeInTheDocument();
  });
});

describe("DashboardPage group event entries", () => {
  const dayLabel = (d: number) =>
    formatIsoDate(inVisibleMonth(d), "en-GB", { day: "numeric", month: "long" });
  const original = document.elementsFromPoint;

  const retro: GroupEventRow = {
    id: "ge-1",
    groupId: "g-1",
    groupName: "Platform",
    title: "Retro",
    note: null,
    startDate: inVisibleMonth(14),
    endDate: inVisibleMonth(14),
    startTime: "14:00",
    endTime: "15:00",
    repeat: null,
    skippedDates: [],
    recurringEventId: null,
    originalDate: null,
    createdBy: dana,
    canEdit: true,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  };

  const stripes = () => {
    settings = { ...DEFAULT_SETTINGS, dashboardCalendarView: "STRIPES" };
  };
  const stripesDay = (d: number) =>
    screen.getByRole("button", { name: new RegExp(`^\\w+,? ${dayLabel(d)}(,|$)`) });

  async function rightClickMenu(d: number) {
    const cell = document.querySelector(`[data-date="${inVisibleMonth(d)}"]`)!;
    document.elementsFromPoint = vi.fn(() => [cell]);
    fireEvent.contextMenu(cell, { clientX: 10, clientY: 10 });
    return screen.findByRole("menu");
  }

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "MINE", dashboardGroupId: null };
    vacations = [];
    birthdayRows = [];
    groupEventRows = [];
    groupEventGroups = [];
  });

  afterEach(() => {
    document.elementsFromPoint = original;
    act(() => closeGroupEventSheet());
  });

  it("offers no create entry while no group can create", async () => {
    const user = userEvent.setup();
    groupEventGroups = [{ groupId: "g-1", groupName: "Platform", canCreate: false }];
    stripes();
    renderWithClient(<DashboardPage />);

    await user.click(stripesDay(14));
    expect(screen.queryByRole("button", { name: /^New group event on/ })).toBeNull();
    await user.keyboard("{Escape}");

    const menu = await rightClickMenu(14);
    expect(within(menu).getByRole("menuitem", { name: "Request time off" })).toBeInTheDocument();
    expect(within(menu).queryByRole("menuitem", { name: "New group event" })).toBeNull();
  });

  it("offers create in Mine scope while any group can, opening the sheet on the day", async () => {
    const user = userEvent.setup();
    groupEventGroups = [
      { groupId: "g-1", groupName: "Platform", canCreate: false },
      { groupId: "g-2", groupName: "Ops", canCreate: true },
    ];
    stripes();
    renderWithClient(<DashboardPage />);

    await user.click(stripesDay(14));
    await user.click(screen.getByRole("button", { name: /^New group event on/ }));

    expect(groupEventSheetState()).toMatchObject({
      kind: "create",
      date: inVisibleMonth(14),
      groupId: null,
    });
  });

  it("follows the selected group's create right in Group scope", async () => {
    const user = userEvent.setup();
    groupEventGroups = [
      { groupId: "g-1", groupName: "Platform", canCreate: false },
      { groupId: "g-2", groupName: "Ops", canCreate: true },
    ];
    renderWithClient(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: "Group", pressed: false }));

    const menu = await rightClickMenu(14);
    expect(within(menu).queryByRole("menuitem", { name: "New group event" })).toBeNull();
  });

  it("opens the sheet on the day and the selected group from the right-click menu", async () => {
    const user = userEvent.setup();
    groupEventGroups = [{ groupId: "g-1", groupName: "Platform", canCreate: true }];
    renderWithClient(<DashboardPage />);
    await user.click(screen.getByRole("button", { name: "Group", pressed: false }));

    const menu = await rightClickMenu(9);
    await user.click(within(menu).getByRole("menuitem", { name: "New group event" }));

    expect(groupEventSheetState()).toMatchObject({
      kind: "create",
      date: inVisibleMonth(9),
      groupId: "g-1",
    });
  });

  it("keeps Edit and Delete working on a lapsed group", async () => {
    const user = userEvent.setup();
    groupEventRows = [retro];
    groupEventGroups = [{ groupId: "g-1", groupName: "Platform", canCreate: false }];
    renderWithClient(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: `1 group event on ${dayLabel(14)}` }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(groupEventSheetState()).toMatchObject({
      kind: "edit",
      target: { event: retro, occurrenceDate: inVisibleMonth(14) },
    });
    // The card's popover steps aside for the sheet.
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();

    await user.click(screen.getByRole("button", { name: `1 group event on ${dayLabel(14)}` }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(groupEventSheetState()).toMatchObject({ kind: "delete" });
  });
});

describe("DashboardPage teammate's Away", () => {
  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS, dashboardScope: "GROUP", dashboardGroupId: "g-1" };
  });

  it("draws a teammate's Away as a labelled bar, with no note in its hover or aria text", () => {
    // The shape the backend sends a teammate for a pending Sick row.
    vacations = [
      {
        ...day("v-away", sam, inVisibleMonth(18)),
        vacationType: AWAY_RECORD_TYPE,
        approvedAt: null,
        approvedBy: null,
        note: null,
      },
    ];
    renderWithClient(<DashboardPage />);

    const bar = screen.getByTitle("Sam Ruiz · Away · Pending");
    expect(bar).toHaveAttribute("aria-label", "Open request details: Sam Ruiz · Away · Pending");
    expect(document.body).not.toHaveTextContent("AWAY");
  });
});
