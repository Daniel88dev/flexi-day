import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
import type { AttendanceDay } from "@/lib/api/attendance";
import { WeekView } from "../week-view";

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

const week = [
  day("2026-09-07", { workedMinutes: 450, balanceMinutes: -30 }),
  day("2026-09-08"),
  day("2026-09-09", { workedMinutes: 540, balanceMinutes: 60, presenceMinutes: 570 }),
  day("2026-09-10", { autoClosed: true, flagged: true }),
  day("2026-09-11", { open: true, workedMinutes: 200, presenceMinutes: 230, balanceMinutes: -280 }),
  day("2026-09-12", { workedMinutes: 0, presenceMinutes: 0, upcoming: true, balanceMinutes: null }),
  day("2026-09-13", { workedMinutes: 0, presenceMinutes: 0, upcoming: true, balanceMinutes: null }),
];

const renderWeek = (mode: "DAILY" | "MONTHLY" = "DAILY") =>
  renderWithClient(<WeekView days={week} mode={mode} today="2026-09-11" locale="en" />);

describe("WeekView", () => {
  it("totals the days already begun and leaves the rest out", () => {
    renderWeek();

    // 450 + 480 + 540 + 480 + 200 worked against five days of 8:00.
    expect(screen.getByText("Worked").nextSibling).toHaveTextContent("35:50");
    expect(screen.getByText("Required").nextSibling).toHaveTextContent("40:00");
    expect(screen.getByText("Balance").nextSibling).toHaveTextContent("-4:10");
    expect(screen.getByText("Flagged").nextSibling).toHaveTextContent("1");
  });

  it("renders a day against its required time, with what was present", () => {
    renderWeek();

    const monday = screen.getByTestId("week-day-2026-09-07");
    expect(within(monday).getByText("7:30")).toBeInTheDocument();
    expect(within(monday).getByText("of 8:00")).toBeInTheDocument();
    expect(within(monday).getByText("8:30 present")).toBeInTheDocument();
    expect(within(monday).getByText("-0:30")).toBeInTheDocument();
  });

  it("flags the day the sweep closed and the one still running", () => {
    renderWeek();

    expect(
      within(screen.getByTestId("week-day-2026-09-10")).getByText("Auto-closed")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("week-day-2026-09-11")).getByText("Still open")
    ).toBeInTheDocument();
  });

  it("says nothing is owed on a day still to come", () => {
    renderWeek();

    const saturday = screen.getByTestId("week-day-2026-09-12");
    expect(within(saturday).getByText("To come")).toBeInTheDocument();
    expect(within(saturday).queryByText("of 8:00")).not.toBeInTheDocument();
  });

  it("drops the per-day balance in MONTHLY mode", () => {
    renderWeek("MONTHLY");

    expect(within(screen.getByTestId("week-day-2026-09-07")).queryByText("-0:30")).toBeNull();
    expect(screen.getByText("Balance").nextSibling).toHaveTextContent("-4:10");
  });

  it("renders an empty week without figures to show", () => {
    renderWithClient(<WeekView days={[]} mode="DAILY" today="2026-09-11" locale="en" />);

    expect(screen.getByText("Nothing recorded this week.")).toBeInTheDocument();
  });
});

describe("WeekView, excluded days", () => {
  const excludedWeek = [
    day("2026-09-07"),
    day("2026-09-08", {
      requiredMinutes: 240,
      workedMinutes: 250,
      presenceMinutes: 250,
      breaksMinutes: 0,
      deductedMinutes: 0,
      balanceMinutes: 10,
      exclusion: { cause: "ABSENCE", extent: "HALF", label: "VACATION" },
    }),
    day("2026-09-09", {
      requiredMinutes: 0,
      workedMinutes: 0,
      presenceMinutes: 0,
      breaksMinutes: 0,
      deductedMinutes: 0,
      balanceMinutes: null,
      exclusion: { cause: "HOLIDAY", extent: "FULL", label: "St Wenceslas Day" },
    }),
    day("2026-09-10"),
    day("2026-09-11"),
    day("2026-09-12", {
      requiredMinutes: 0,
      workedMinutes: 130,
      presenceMinutes: 130,
      breaksMinutes: 0,
      deductedMinutes: 0,
      balanceMinutes: 130,
      exclusion: { cause: "NON_WORKING_DAY", extent: "FULL", label: null },
      excludedClockIn: true,
      flagged: true,
    }),
    day("2026-09-13", {
      requiredMinutes: 0,
      workedMinutes: 0,
      presenceMinutes: 0,
      breaksMinutes: 0,
      deductedMinutes: 0,
      balanceMinutes: null,
      upcoming: true,
      exclusion: { cause: "NON_WORKING_DAY", extent: "FULL", label: null },
    }),
  ];

  const renderExcludedWeek = () =>
    renderWithClient(<WeekView days={excludedWeek} mode="DAILY" today="2026-09-11" locale="en" />);

  it("says why a day off is a day off instead of what it owed", () => {
    renderExcludedWeek();

    const holiday = screen.getByTestId("week-day-2026-09-09");
    expect(within(holiday).getByText("St Wenceslas Day")).toBeInTheDocument();
    expect(within(holiday).queryByText("of 8:00")).toBeNull();
    expect(within(holiday).queryByText("0:00")).toBeNull();
  });

  it("halves a half day and names what took it", () => {
    renderExcludedWeek();

    const halfDay = screen.getByTestId("week-day-2026-09-08");
    expect(within(halfDay).getByText("of 4:00, half day")).toBeInTheDocument();
    expect(within(halfDay).getByText("Vacation ½")).toBeInTheDocument();
    expect(within(halfDay).getByText("+0:10")).toBeInTheDocument();
  });

  it("flags a clock-in on a day nobody owed and keeps its worked time", () => {
    renderExcludedWeek();

    const saturday = screen.getByTestId("week-day-2026-09-12");
    expect(within(saturday).getByText("2:10")).toBeInTheDocument();
    expect(within(saturday).getByText("Non-working day")).toBeInTheDocument();
    expect(within(saturday).getByText("Excluded day")).toBeInTheDocument();
  });

  it("shows a day off still to come as the day off it already is", () => {
    renderExcludedWeek();

    const sunday = screen.getByTestId("week-day-2026-09-13");
    expect(within(sunday).getByText("Non-working day")).toBeInTheDocument();
    expect(within(sunday).queryByText("To come")).toBeNull();
  });

  it("leaves the days off out of what the week required", () => {
    renderExcludedWeek();

    // Three whole days of 8:00 and one half day of 4:00.
    expect(screen.getByText("Required").nextSibling).toHaveTextContent("28:00");
  });
});
