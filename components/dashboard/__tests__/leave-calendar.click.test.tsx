import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveCalendar, MAX_LANES, type CalendarRange } from "../leave-calendar";
import { VacationKind } from "@/lib/api/types";

// July 2026 starts on a Wednesday → Monday-indexed offset of 2.
const baseProps = {
  monthDays: 31,
  firstWeekdayMondayIdx: 2,
} as const;

describe("LeaveCalendar day clicks", () => {
  it("calls onDayClick with the day-of-month when an empty cell is clicked", async () => {
    const onDayClick = vi.fn();
    const user = userEvent.setup();
    render(<LeaveCalendar {...baseProps} ranges={[]} onDayClick={onDayClick} />);

    await user.click(screen.getByRole("button", { name: "Create request for day 15" }));

    expect(onDayClick).toHaveBeenCalledWith(15);
  });

  it("does not make day cells interactive when onDayClick is absent", () => {
    render(<LeaveCalendar {...baseProps} ranges={[]} />);

    expect(screen.queryByRole("button", { name: /Create request for day/ })).toBeNull();
  });

  it("clicking a leave bar opens the detail (onSelect), not a new request (onDayClick)", async () => {
    const onSelect = vi.fn();
    const onDayClick = vi.fn();
    const user = userEvent.setup();
    const ranges: CalendarRange[] = [
      {
        id: "r0",
        who: "u1",
        user: { id: "u1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
        type: VacationKind.Vacation,
        from: 10,
        to: 10,
        vacationIds: ["v-10"],
      },
    ];

    render(
      <LeaveCalendar {...baseProps} ranges={ranges} onSelect={onSelect} onDayClick={onDayClick} />
    );

    await user.click(screen.getByRole("button", { name: /Open request details/ }));

    expect(onSelect).toHaveBeenCalledWith("v-10");
    expect(onDayClick).not.toHaveBeenCalled();
  });
});

describe("LeaveCalendar bank holiday lanes", () => {
  const bankDay = (day: number, name: string): CalendarRange => ({
    id: `bh-${day}`,
    who: "all",
    type: VacationKind.BankHoliday,
    from: day,
    to: day,
    note: name,
    vacationIds: [],
  });

  it("charges any number of same-week holidays as a single lane", () => {
    // Two holidays share the pill row; with MAX_LANES = 2 one bar lane stays
    // free, so the vacation bar must render instead of collapsing into "+1".
    const ranges: CalendarRange[] = [
      bankDay(9, "First Holiday"),
      bankDay(10, "Second Holiday"),
      {
        id: "r0",
        who: "u1",
        user: { id: "u1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
        type: VacationKind.Vacation,
        from: 8,
        to: 8,
        vacationIds: ["v-8"],
      },
    ];

    render(<LeaveCalendar {...baseProps} ranges={ranges} />);

    expect(screen.getByText("🎉 First Holiday")).toBeInTheDocument();
    expect(screen.getByText("🎉 Second Holiday")).toBeInTheDocument();
    expect(screen.getByTitle("Dana Holt · Vacation")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });
});

// Everyone off on the same day: each needs its own lane in that week.
function sameDayRanges(count: number, day: number): CalendarRange[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `r${i}`,
    who: `u${i}`,
    user: {
      id: `u${i}`,
      name: `Person ${i}`,
      initials: `P${i}`,
      avatarColor: "hsl(270 60% 60%)",
    },
    type: VacationKind.Vacation,
    from: day,
    to: day,
    vacationIds: [`v-${i}`],
  }));
}

// Assertions follow MAX_LANES so tuning the density does not break them.
const TOTAL = MAX_LANES + 2;
const HIDDEN = TOTAL - MAX_LANES;
// The chip is labelled for screen readers with the day it belongs to.
const chipLabel = (day: number) => new RegExp(`${HIDDEN} more requests? on day ${day}`);
const anyChip = /more requests? on day/;

describe("LeaveCalendar overflow", () => {
  it(`shows only the first ${MAX_LANES} bar(s) of a week and counts the rest`, () => {
    render(<LeaveCalendar {...baseProps} ranges={sameDayRanges(TOTAL, 15)} onSelect={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: /Open request details/ })).toHaveLength(MAX_LANES);
    expect(screen.getByRole("button", { name: chipLabel(15) })).toBeInTheDocument();
  });

  it("puts the chip in the day column whose entries are hidden", () => {
    // Day 15 is a Wednesday in July 2026 → third column of its week.
    render(<LeaveCalendar {...baseProps} ranges={sameDayRanges(TOTAL, 15)} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: chipLabel(15) }).parentElement).toHaveStyle({
      gridColumn: "3 / 4",
    });
  });

  it("lists the hidden records in a popover, naming each person", async () => {
    const user = userEvent.setup();
    render(<LeaveCalendar {...baseProps} ranges={sameDayRanges(TOTAL, 15)} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: chipLabel(15) }));

    // The hidden ones are the trailing lanes: everyone past MAX_LANES.
    for (let i = MAX_LANES; i < TOTAL; i++) {
      expect(screen.getByText(`Person ${i}`)).toBeInTheDocument();
    }
    // Records already visible on the calendar are not repeated in the popover.
    expect(screen.queryByText("Person 0")).toBeNull();
  });

  it("opens the request detail when a hidden record is picked, and closes the popover", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<LeaveCalendar {...baseProps} ranges={sameDayRanges(TOTAL, 15)} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: chipLabel(15) }));
    await user.click(screen.getByText(`Person ${MAX_LANES}`));

    expect(onSelect).toHaveBeenCalledWith(`v-${MAX_LANES}`);
    expect(screen.queryByText(`Person ${MAX_LANES}`)).toBeNull();
  });

  it("gives each overflowing day its own chip", () => {
    // Day 15 and day 22 fall in different weeks of July 2026.
    render(
      <LeaveCalendar
        {...baseProps}
        ranges={[...sameDayRanges(TOTAL, 15), ...sameDayRanges(TOTAL, 22)]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getAllByRole("button", { name: anyChip })).toHaveLength(2);
  });

  it("leaves no chip when the week fits", () => {
    render(
      <LeaveCalendar {...baseProps} ranges={sameDayRanges(MAX_LANES, 15)} onSelect={vi.fn()} />
    );

    expect(screen.queryByRole("button", { name: /more/ })).toBeNull();
  });
});
