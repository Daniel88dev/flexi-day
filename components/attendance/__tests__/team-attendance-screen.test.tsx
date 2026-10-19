import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient, withClient } from "@/lib/test-utils";
import type {
  AttendanceTeam,
  AttendanceTeamDay,
  AttendanceTeamPerson,
  TeamAttendanceParams,
} from "@/lib/api/attendance";
import type { OrganizationSummary } from "@/lib/api/organization";
import type { GroupListItem } from "@/lib/api/types";
import { TeamAttendanceScreen } from "../team-attendance-screen";

const teamQuery = {
  data: undefined as AttendanceTeam | undefined,
  isPending: false,
  error: null as Error | null,
};
const teamRequests: (TeamAttendanceParams | null)[] = [];
/** Answers per range, for a read that has not answered for every range yet. */
const answerFor = {
  current: null as ((params: TeamAttendanceParams) => AttendanceTeam | undefined) | null,
};
const organizationDetail = {
  data: undefined as { groups: { id: string; groupName: string }[] } | undefined,
};
const organizationDetailRequests: (string | null | undefined)[] = [];

const groups = { data: [] as GroupListItem[], isPending: false };
const organizations = { data: [] as OrganizationSummary[], isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useTeamAttendance: (params: TeamAttendanceParams | null, enabled = true) => {
    teamRequests.push(enabled ? params : null);
    return answerFor.current
      ? { ...teamQuery, data: params ? answerFor.current(params) : undefined }
      : teamQuery;
  },
  useGroups: () => groups,
  useOrganizations: () => organizations,
  useOrganization: (organizationId?: string | null) => {
    organizationDetailRequests.push(organizationId);
    return organizationDetail;
  },
  // The correction dialog, which reads nothing until a cell opens it.
  useAttendanceDay: () => correctionDay,
  useSessionEvents: () => ({ data: [], isPending: false, error: null }),
  useCorrectSession: () => idle,
  useCorrectBreak: () => idle,
  useRemoveBreak: () => idle,
  useRemoveSession: () => idle,
  useAddBreak: () => idle,
  useEnterSession: () => idle,
  useMarkSessionChecked: () => idle,
}));

const idle = { mutateAsync: vi.fn(), isPending: false };
const correctionDay = { data: undefined, isPending: true, error: null };

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "olivia" } }, isPending: false }),
}));

const studio: OrganizationSummary = { id: "org-1", name: "Studio Modrá", isOwner: true };

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
  selfService: { enabled: true, days: 7 },
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
    organizationDetailRequests.length = 0;
    groups.data = [];
    organizations.data = [studio];
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

  it("offers an organization administered by delegation beside the viewer's own", async () => {
    const own: OrganizationSummary = { id: "org-own", name: "Milo West", isOwner: true };
    organizations.data = [own, { ...studio, isOwner: false }];
    teamQuery.data = team({ people: [person("noah", "Noah Weber", plainWeek())] });
    renderWithClient(<TeamAttendanceScreen />);

    expect(teamRequests.at(-1)).toMatchObject({ organizationId: "org-own" });
    const picker = screen.getByRole("combobox", { name: "Organization" });
    expect(picker).toHaveTextContent("Milo West");

    await userEvent.click(picker);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Milo West",
      "Studio Modrá",
    ]);
    await userEvent.click(screen.getByRole("option", { name: "Studio Modrá" }));

    expect(teamRequests.at(-1)).toMatchObject({ organizationId: "org-1", groupId: null });
    expect(organizationDetailRequests.at(-1)).toBe("org-1");
    expect(screen.getByRole("combobox", { name: "Group" })).toBeInTheDocument();
  });

  it("shows no group filter to a group admin, whose list is their groups already", () => {
    organizations.data = [];
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

  it("shows a group admin the self-service setting read-only", () => {
    organizations.data = [];
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

    expect(screen.getByText("Self-service is on, 7 days back.")).toBeInTheDocument();
    expect(screen.getByText("Set by organization admins")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Change" })).not.toBeInTheDocument();
  });

  it("gives an org admin the same line with a way to change it", () => {
    teamQuery.data = team({ people: [person("noah", "Noah Weber", plainWeek())] });
    renderWithClient(<TeamAttendanceScreen />);

    expect(screen.getByText("Self-service is on, 7 days back.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change" })).toHaveAttribute("href", "/organization");
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
    organizations.data = [];
    renderWithClient(<TeamAttendanceScreen />);

    expect(
      screen.getByText("Team attendance is for group admins and organization admins.")
    ).toBeInTheDocument();
    expect(teamRequests.every((request) => request === null)).toBe(true);
  });

  it("opens the correction dialog from a day somebody worked", async () => {
    teamQuery.data = team({ people: [person("noah", "Noah Weber", plainWeek())] });
    renderWithClient(<TeamAttendanceScreen />);

    // The weekend nobody worked has nothing to correct and so is not a button.
    expect(screen.queryByRole("button", { name: /Noah Weber's Saturday/ })).not.toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole("button", { name: /Noah Weber's Wednesday, September 9/ })[0]!
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Correct Wednesday, September 9");
    expect(screen.getByRole("dialog")).toHaveTextContent("Noah Weber");
  });

  describe("entered sessions", () => {
    const empty = (businessDate: string, overrides: Partial<AttendanceTeamDay> = {}) =>
      day(businessDate, {
        presenceMinutes: 0,
        breaksMinutes: 0,
        deductedMinutes: 0,
        workedMinutes: 0,
        balanceMinutes: -480,
        ...overrides,
      });

    it("offers Add on an empty past day, and opens the form for that person", async () => {
      const week = plainWeek();
      week[3] = empty(WEEK[3]!);
      teamQuery.data = team({ people: [person("tom", "Tom Becker", week)] });
      renderWithClient(<TeamAttendanceScreen />);

      await userEvent.click(
        screen.getByRole("button", {
          name: "Add a session for Tom Becker on Thursday, September 10",
        })
      );

      expect(
        screen.getByRole("heading", { name: "Add a session for Tom Becker" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Date")).toHaveValue("2026-09-10");
    });

    it("offers no Add on a day with sessions, one still to come, or one outside the employment", () => {
      const week = plainWeek();
      week[0] = empty(WEEK[0]!, {
        exclusion: { cause: "NOT_EMPLOYED", extent: "FULL", label: null },
      });
      week[5] = { ...week[5]!, upcoming: true };
      week[6] = { ...week[6]!, upcoming: true };
      teamQuery.data = team({ people: [person("tom", "Tom Becker", week)] });
      renderWithClient(<TeamAttendanceScreen />);

      expect(screen.queryByRole("button", { name: /^Add a session for/ })).not.toBeInTheDocument();
    });

    it("stamps an entered day, and explains the stamp in the legend", () => {
      const week = plainWeek();
      week[1] = day(WEEK[1]!, { entered: true });
      teamQuery.data = team({ people: [person("noah", "Noah Weber", week)] });
      renderWithClient(<TeamAttendanceScreen />);

      expect(
        within(screen.getByTestId("team-day-noah-2026-09-08")).getByText("Entered")
      ).toBeInTheDocument();
      expect(
        within(screen.getByTestId("team-day-noah-2026-09-09")).queryByText("Entered")
      ).toBeNull();
      expect(screen.getByText("Recorded after the fact, for good")).toBeInTheDocument();
    });
  });

  describe("sessions changed after the day", () => {
    it("marks the changed day apart from the other flags, and explains it in the legend", () => {
      const week = plainWeek();
      week[2] = day(WEEK[2]!, { changedAfterDay: true, flagged: true });
      teamQuery.data = team({ people: [person("noah", "Noah Weber", week)] });
      renderWithClient(<TeamAttendanceScreen />);

      const changed = within(screen.getByTestId("team-day-noah-2026-09-09"));
      expect(changed.getByText("Changed later")).toBeInTheDocument();
      expect(changed.queryByText("Auto-closed")).toBeNull();
      expect(changed.queryByText("Entered")).toBeNull();
      expect(
        within(screen.getByTestId("team-day-noah-2026-09-08")).queryByText("Changed later")
      ).toBeNull();
      expect(
        screen.getByText(
          "Changed by the person after the day, until an admin corrects it or marks it checked"
        )
      ).toBeInTheDocument();
    });

    it("drops the marker once the read comes back cleared", () => {
      const week = plainWeek();
      week[2] = day(WEEK[2]!, { changedAfterDay: true, flagged: true });
      teamQuery.data = team({ people: [person("noah", "Noah Weber", week)] });
      const { rerender } = renderWithClient(<TeamAttendanceScreen />);

      const cleared = plainWeek();
      teamQuery.data = team({ people: [person("noah", "Noah Weber", cleared)] });
      rerender(withClient(<TeamAttendanceScreen />));

      expect(
        within(screen.getByTestId("team-day-noah-2026-09-09")).queryByText("Changed later")
      ).toBeNull();
    });
  });

  describe("the period it opens on", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      // Sunday 18 Oct, 20:00 in Los Angeles: already Monday 19 Oct in UTC.
      vi.setSystemTime(new Date(2026, 9, 18, 20));
    });

    afterEach(() => {
      vi.useRealTimers();
      answerFor.current = null;
    });

    const mondayTeam = () =>
      team({ businessDate: "2026-10-19", from: "2026-10-19", to: "2026-10-25" });

    it("opens on the local week, then moves to the organization's once the read names it", () => {
      const { rerender } = renderWithClient(<TeamAttendanceScreen />);
      expect(teamRequests.at(-1)).toMatchObject({ from: "2026-10-12", to: "2026-10-18" });

      // The local week's read answers; the organization's week has not answered yet.
      answerFor.current = (params) =>
        params.from === "2026-10-12"
          ? team({ businessDate: "2026-10-19", from: "2026-10-12", to: "2026-10-18" })
          : undefined;
      rerender(withClient(<TeamAttendanceScreen />));
      expect(teamRequests.at(-1)).toMatchObject({ from: "2026-10-19", to: "2026-10-25" });

      rerender(withClient(<TeamAttendanceScreen />));
      expect(teamRequests.at(-1)).toMatchObject({ from: "2026-10-19", to: "2026-10-25" });
    });

    it("keeps the period the admin stepped to when the read answers", async () => {
      const { rerender } = renderWithClient(<TeamAttendanceScreen />);
      await userEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(teamRequests.at(-1)).toMatchObject({ from: "2026-10-19", to: "2026-10-25" });
      await userEvent.click(screen.getByRole("button", { name: "Previous" }));
      expect(teamRequests.at(-1)).toMatchObject({ from: "2026-10-12", to: "2026-10-18" });

      teamQuery.data = mondayTeam();
      rerender(withClient(<TeamAttendanceScreen />));
      expect(teamRequests.at(-1)).toMatchObject({ from: "2026-10-12", to: "2026-10-18" });
    });
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
