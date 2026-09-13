import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type {
  AttendanceTeam,
  AttendanceTeamDay,
  AttendanceTeamPerson,
  TeamAttendanceParams,
} from "@/lib/api/attendance";
import type { GroupListItem } from "@/lib/api/types";
import type { ViewerRoles } from "@/lib/viewer/use-viewer-roles";
import { TeamAttendanceScreen } from "../team-attendance-screen";

const teamQuery = {
  data: undefined as AttendanceTeam | undefined,
  isPending: false,
  error: null as Error | null,
};
const teamRequests: (TeamAttendanceParams | null)[] = [];
const roles = { current: null as ViewerRoles | null };
const organizationDetail = {
  data: undefined as { groups: { id: string; groupName: string }[] } | undefined,
};

const groups = { data: [] as GroupListItem[], isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useTeamAttendance: (params: TeamAttendanceParams | null, enabled = true) => {
    teamRequests.push(enabled ? params : null);
    return teamQuery;
  },
  useGroups: () => groups,
  useOrganization: () => organizationDetail,
}));

vi.mock("@/lib/viewer/use-viewer-roles", () => ({
  useViewerRoles: () => roles.current,
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "olivia" } }, isPending: false }),
}));

const orgAdmin: ViewerRoles = {
  isLoading: false,
  isOrgAdmin: true,
  isOrgOwner: true,
  organization: { id: "org-1", name: "Studio Modrá", isOwner: true },
  isGroupAdmin: true,
  administeredGroups: [],
  plan: { name: "PRO", active: true },
  attendanceActive: true,
};

const nobody: ViewerRoles = {
  ...orgAdmin,
  isOrgAdmin: false,
  isOrgOwner: false,
  organization: null,
  isGroupAdmin: false,
  attendanceActive: false,
};

const WEEK = [
  "2026-09-07",
  "2026-09-08",
  "2026-09-09",
  "2026-09-10",
  "2026-09-11",
  "2026-09-12",
  "2026-09-13",
];

const day = (
  businessDate: string,
  overrides: Partial<AttendanceTeamDay> = {}
): AttendanceTeamDay => ({
  businessDate,
  presenceMinutes: 510,
  breaksMinutes: 30,
  deductedMinutes: 30,
  workedMinutes: 480,
  requiredMinutes: 480,
  balanceMinutes: 0,
  upcoming: false,
  open: false,
  autoClosed: false,
  exclusion: null,
  excludedClockIn: false,
  flagged: false,
  ...overrides,
});

const weekend = (businessDate: string) =>
  day(businessDate, {
    presenceMinutes: 0,
    workedMinutes: 0,
    requiredMinutes: 0,
    balanceMinutes: null,
    exclusion: { cause: "NON_WORKING_DAY", extent: "FULL", label: null },
  });

const person = (
  userId: string,
  name: string,
  days: AttendanceTeamDay[],
  overrides: Partial<AttendanceTeamPerson> = {}
): AttendanceTeamPerson => ({
  employmentId: `emp-${userId}`,
  userId,
  user: { id: userId, name, initials: name[0]!, avatarColor: "hsl(200 50% 50%)" },
  groups: [{ id: "eng", groupName: "Engineering" }],
  requiredMinutesPerDay: 480,
  requiredMinutesOverride: null,
  days,
  totals: {
    presenceMinutes: 0,
    workedMinutes: days.reduce((total, entry) => total + entry.workedMinutes, 0),
    requiredMinutes: days.reduce((total, entry) => total + entry.requiredMinutes, 0),
    requiredRangeMinutes: 0,
    balanceMinutes: 0,
    flaggedDays: days.filter((entry) => entry.flagged).length,
    excludedDays: 2,
  },
  ...overrides,
});

const team = (overrides: Partial<AttendanceTeam> = {}): AttendanceTeam => ({
  organizationId: "org-1",
  timezone: "Europe/Prague",
  businessDate: "2026-09-11",
  from: WEEK[0]!,
  to: WEEK[6]!,
  balanceMode: "DAILY",
  requiredMinutesPerDay: 480,
  breakMinutes: 30,
  breakThresholdMinutes: 360,
  scope: "ORGANIZATION",
  group: null,
  people: [],
  inNow: [],
  ...overrides,
});

const plainWeek = () => [
  ...WEEK.slice(0, 5).map((date) => day(date)),
  weekend(WEEK[5]!),
  weekend(WEEK[6]!),
];

describe("TeamAttendanceScreen", () => {
  beforeEach(() => {
    teamQuery.data = undefined;
    teamQuery.isPending = false;
    teamQuery.error = null;
    teamRequests.length = 0;
    groups.data = [];
    roles.current = orgAdmin;
    organizationDetail.data = {
      groups: [
        { id: "eng", groupName: "Engineering" },
        { id: "sales", groupName: "Sales" },
      ],
    };
  });

  it("offers the group filter to an org admin, with the organization's groups", async () => {
    teamQuery.data = team({ people: [person("noah", "Noah Weber", plainWeek())] });
    renderWithClient(<TeamAttendanceScreen />);

    expect(screen.getByText("Everyone in Studio Modrá, 1 person.")).toBeInTheDocument();
    const filter = screen.getByRole("combobox", { name: "Group" });
    expect(filter).toHaveTextContent("All groups");

    await userEvent.click(filter);
    await userEvent.click(await screen.findByRole("option", { name: "Sales" }));

    expect(teamRequests.at(-1)).toMatchObject({ organizationId: "org-1", groupId: "sales" });
  });

  it("shows no group filter to a group admin, whose list is their groups already", () => {
    roles.current = { ...orgAdmin, isOrgAdmin: false, isOrgOwner: false, organization: null };
    // A group admin's organization comes from the groups they administer.
    groups.data = [
      {
        id: "eng",
        organizationId: "org-1",
        organization: { id: "org-1", name: "Studio Modrá" },
        groupName: "Engineering",
        managerUserId: "olivia",
      } as GroupListItem,
    ];
    teamQuery.data = team({ scope: "GROUPS", people: [person("noah", "Noah Weber", plainWeek())] });
    renderWithClient(<TeamAttendanceScreen />);

    expect(screen.getByText("Your groups, 1 person.")).toBeInTheDocument();
    expect(screen.getByTestId("team-row-noah")).toBeInTheDocument();
    expect(teamRequests.at(-1)).toMatchObject({ organizationId: "org-1", groupId: null });
    expect(screen.queryByRole("combobox", { name: "Group" })).not.toBeInTheDocument();
  });

  it("renders the three flags in the cells and who is in now above them", () => {
    const noah = person("noah", "Noah Weber", [
      day(WEEK[0]!, { autoClosed: true, flagged: true, workedMinutes: 930, presenceMinutes: 960 }),
      day(WEEK[1]!, { open: true, flagged: true, workedMinutes: 799 }),
      day(WEEK[2]!),
      day(WEEK[3]!),
      day(WEEK[4]!, { open: true, workedMinutes: 203, presenceMinutes: 203 }),
      weekend(WEEK[5]!),
      weekend(WEEK[6]!),
    ]);
    const sofia = person("sofia", "Sofia Almeida", [
      ...WEEK.slice(0, 5).map((date) => day(date)),
      day(WEEK[5]!, {
        excludedClockIn: true,
        flagged: true,
        workedMinutes: 150,
        presenceMinutes: 150,
        requiredMinutes: 0,
        exclusion: { cause: "NON_WORKING_DAY", extent: "FULL", label: null },
      }),
      weekend(WEEK[6]!),
    ]);
    teamQuery.data = team({
      people: [noah, sofia],
      inNow: [
        {
          employmentId: "emp-noah",
          userId: "noah",
          sessionId: "s-1",
          businessDate: WEEK[4]!,
          startedAt: "2026-09-11T06:42:00Z",
          onBreak: false,
          breakStartedAt: null,
        },
      ],
    });
    renderWithClient(<TeamAttendanceScreen />);

    const cell = (userId: string, date: string) =>
      within(screen.getByTestId(`team-day-${userId}-${date}`));
    expect(cell("noah", WEEK[0]!).getByText("Auto-closed")).toBeInTheDocument();
    expect(cell("noah", WEEK[1]!).getByText("Still open")).toBeInTheDocument();
    expect(cell("sofia", WEEK[5]!).getByText("Excluded day")).toBeInTheDocument();
    expect(cell("noah", WEEK[4]!).getByText("since 08:42")).toBeInTheDocument();

    const inNow = within(screen.getByTestId("in-now"));
    expect(inNow.getByText("Noah")).toBeInTheDocument();
    expect(inNow.getByText("since 08:42")).toBeInTheDocument();
    expect(screen.queryByText("Nothing recorded in this range.")).not.toBeInTheDocument();
  });

  it("says when nobody in the range was at work, and when there is nobody at all", () => {
    const idle = plainWeek().map((entry) =>
      day(entry.businessDate, { ...entry, presenceMinutes: 0, workedMinutes: 0 })
    );
    teamQuery.data = team({ people: [person("noah", "Noah Weber", idle)] });
    const { unmount } = renderWithClient(<TeamAttendanceScreen />);

    expect(screen.getByText("Nothing recorded in this range.")).toBeInTheDocument();
    expect(screen.getByTestId("team-row-noah")).toBeInTheDocument();
    unmount();

    teamQuery.data = team({ people: [] });
    renderWithClient(<TeamAttendanceScreen />);

    expect(screen.getByText("Nobody to show.")).toBeInTheDocument();
    expect(screen.getByText("Nobody is clocked in.")).toBeInTheDocument();
  });

  it("tells someone who administers nothing that the page is not theirs, without asking", () => {
    roles.current = nobody;
    renderWithClient(<TeamAttendanceScreen />);

    expect(
      screen.getByText("Team attendance is for group admins and organization admins.")
    ).toBeInTheDocument();
    expect(teamRequests.every((request) => request === null)).toBe(true);
  });

  it("refuses a custom range that is inside out or longer than a quarter, and asks nothing", async () => {
    teamQuery.data = team({ people: [person("noah", "Noah Weber", plainWeek())] });
    renderWithClient(<TeamAttendanceScreen />);

    await userEvent.click(screen.getByRole("tab", { name: "Range" }));
    const from = screen.getByLabelText("From");
    const to = screen.getByLabelText("To");

    await userEvent.clear(to);
    await userEvent.type(to, "2020-01-01");
    expect(screen.getByText("The range ends before it starts.")).toBeInTheDocument();
    expect(teamRequests.at(-1)).toBeNull();

    await userEvent.clear(from);
    await userEvent.type(from, "2020-01-01");
    await userEvent.clear(to);
    await userEvent.type(to, "2020-12-31");
    expect(screen.getByText("At most 93 days at a time.")).toBeInTheDocument();
    expect(teamRequests.at(-1)).toBeNull();
  });
});
