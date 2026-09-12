import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
import type { AttendanceDay, AttendanceMonth } from "@/lib/api/attendance";
import { MonthView } from "../month-view";

const day = (businessDate: string, overrides: Partial<AttendanceDay> = {}): AttendanceDay => ({
  businessDate,
  presenceMinutes: 510,
  breaksMinutes: 20,
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
  sessions: [],
  ...overrides,
});

/** September 2026: the 1st is a Tuesday, so the grid opens with one blank. */
const month = (overrides: Partial<AttendanceMonth> = {}): AttendanceMonth => ({
  organizationId: "org-1",
  employmentId: "emp-1",
  timezone: "Europe/Prague",
  businessDate: "2026-09-03",
  year: 2026,
  month: 9,
  balanceMode: "DAILY",
  requiredMinutesPerDay: 480,
  requiredMinutesOverride: null,
  breakMinutes: 30,
  breakThresholdMinutes: 360,
  days: [
    day("2026-09-01", { workedMinutes: 450, balanceMinutes: -30 }),
    day("2026-09-02", { autoClosed: true, flagged: true }),
    day("2026-09-03", {
      open: true,
      workedMinutes: 200,
      presenceMinutes: 230,
      balanceMinutes: -280,
    }),
    day("2026-09-04", {
      workedMinutes: 0,
      presenceMinutes: 0,
      upcoming: true,
      balanceMinutes: null,
    }),
  ],
  totals: {
    presenceMinutes: 1250,
    workedMinutes: 1130,
    requiredMinutes: 1440,
    requiredRangeMinutes: 14400,
    balanceMinutes: -310,
    flaggedDays: 1,
    excludedDays: 0,
  },
  ...overrides,
});

describe("MonthView", () => {
  it("puts the month's figures on top, measured against the days already begun", () => {
    renderWithClient(<MonthView month={month()} locale="en" />);

    expect(screen.getByText("Worked").nextSibling).toHaveTextContent("18:50");
    expect(screen.getByText("Required so far").nextSibling).toHaveTextContent("24:00");
    expect(screen.getByText("Balance").nextSibling).toHaveTextContent("-5:10");
    expect(screen.getByText("against required to date")).toBeInTheDocument();
    expect(screen.getByText("Flagged").nextSibling).toHaveTextContent("1");
  });

  it("shows the whole month's required time instead of the flag count in MONTHLY mode", () => {
    renderWithClient(<MonthView month={month({ balanceMode: "MONTHLY" })} locale="en" />);

    expect(screen.getByText("Month balance").nextSibling).toHaveTextContent("-5:10");
    expect(screen.getByText("Month required").nextSibling).toHaveTextContent("240:00");
    expect(screen.queryByText("Flagged")).toBeNull();
  });

  it("renders a day against its required time with its balance", () => {
    renderWithClient(<MonthView month={month()} locale="en" />);

    const first = screen.getByTestId("month-day-2026-09-01");
    expect(within(first).getByText("7:30")).toBeInTheDocument();
    expect(within(first).getByText("of 8:00")).toBeInTheDocument();
    expect(within(first).getByText("-0:30")).toBeInTheDocument();
  });

  it("drops every per-day balance in MONTHLY mode", () => {
    renderWithClient(<MonthView month={month({ balanceMode: "MONTHLY" })} locale="en" />);

    expect(within(screen.getByTestId("month-day-2026-09-01")).queryByText("-0:30")).toBeNull();
    expect(
      within(screen.getByTestId("month-day-2026-09-01")).getByText("7:30")
    ).toBeInTheDocument();
  });

  it("flags the swept day and the one still running", () => {
    renderWithClient(<MonthView month={month()} locale="en" />);

    expect(
      within(screen.getByTestId("month-day-2026-09-02")).getByText("Auto-closed")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("month-day-2026-09-03")).getByText("Still open")
    ).toBeInTheDocument();
  });

  it("leaves a day still to come empty, and off the phone's list", () => {
    renderWithClient(<MonthView month={month()} locale="en" />);

    const upcoming = screen.getByTestId("month-day-2026-09-04");
    expect(within(upcoming).getByText("4")).toBeInTheDocument();
    expect(within(upcoming).queryByText("of 8:00")).toBeNull();
    expect(screen.queryByTestId("month-row-2026-09-04")).toBeNull();
    expect(screen.getByTestId("month-row-2026-09-01")).toBeInTheDocument();
  });

  it("says so when the month holds nothing at all", () => {
    renderWithClient(
      <MonthView
        month={month({
          days: [day("2026-09-01", { presenceMinutes: 0, workedMinutes: 0, balanceMinutes: -480 })],
        })}
        locale="en"
      />
    );

    expect(screen.getByText("Nothing recorded this month.")).toBeInTheDocument();
  });
});

describe("MonthView, excluded days", () => {
  const withDaysOff = () =>
    month({
      days: [
        day("2026-09-01"),
        day("2026-09-02", {
          requiredMinutes: 0,
          workedMinutes: 0,
          presenceMinutes: 0,
          balanceMinutes: null,
          exclusion: { cause: "ABSENCE", extent: "FULL", label: "SICK_DAY" },
        }),
        day("2026-09-03", {
          requiredMinutes: 240,
          workedMinutes: 250,
          presenceMinutes: 250,
          balanceMinutes: 10,
          exclusion: { cause: "ABSENCE", extent: "HALF", label: "VACATION" },
        }),
        day("2026-09-04", {
          requiredMinutes: 0,
          workedMinutes: 0,
          presenceMinutes: 0,
          balanceMinutes: null,
          upcoming: true,
          exclusion: { cause: "NON_WORKING_DAY", extent: "FULL", label: null },
        }),
      ],
      totals: {
        presenceMinutes: 760,
        workedMinutes: 730,
        requiredMinutes: 720,
        requiredRangeMinutes: 720,
        balanceMinutes: 10,
        flaggedDays: 0,
        excludedDays: 2,
      },
    });

  it("counts the days off among the month's figures", () => {
    renderWithClient(<MonthView month={withDaysOff()} locale="en" />);

    expect(screen.getByText("Excluded days").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("of 4")).toBeInTheDocument();
  });

  it("names each day off in its cell, half days included", () => {
    renderWithClient(<MonthView month={withDaysOff()} locale="en" />);

    expect(
      within(screen.getByTestId("month-day-2026-09-02")).getByText("Sick day")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("month-day-2026-09-03")).getByText("of 4:00, half day")
    ).toBeInTheDocument();
  });

  it("counts the days off against the days that were this person's to work", () => {
    const month163 = withDaysOff();
    renderWithClient(
      <MonthView
        month={{
          ...month163,
          days: [
            {
              ...month163.days[0],
              exclusion: { cause: "NOT_EMPLOYED", extent: "FULL", label: null },
              requiredMinutes: 0,
              workedMinutes: 0,
              presenceMinutes: 0,
              balanceMinutes: null,
            },
            ...month163.days.slice(1),
          ],
        }}
        locale="en"
      />
    );

    // Three days off in a month, one of which nobody was employed for.
    expect(screen.getByText("of 3")).toBeInTheDocument();
  });

  it("draws a day off still to come rather than leaving its cell blank", () => {
    renderWithClient(<MonthView month={withDaysOff()} locale="en" />);

    expect(
      within(screen.getByTestId("month-day-2026-09-04")).getByText("Non-working day")
    ).toBeInTheDocument();
  });
});
