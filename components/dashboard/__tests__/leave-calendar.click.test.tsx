import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveCalendar, MAX_LANES, type CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import { isoDate } from "@/lib/calendar/month-grid";

// July 2026 starts on a Wednesday, so its first week opens with two padding days.
const baseProps = { year: 2026, month: 7 } as const;
describe("LeaveCalendar day clicks", () => {
  it("calls onDayClick with the cell's date when an empty cell is clicked", async () => {
    const onDayClick = vi.fn();
    const user = userEvent.setup();
    render(<LeaveCalendar {...baseProps} ranges={[]} onDayClick={onDayClick} />);

    await user.click(screen.getByRole("button", { name: "Create request for day 15" }));

    expect(onDayClick).toHaveBeenCalledWith("2026-07-15");
  });

  it("leaves the padding days outside the month empty and not clickable", () => {
    render(<LeaveCalendar {...baseProps} ranges={[]} onDayClick={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: /Create request for day/ })).toHaveLength(31);
    expect(screen.queryByText("30")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(1);
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
        type: CalendarRecordType.Vacation,
        from: isoDate(2026, 7, 10),
        to: isoDate(2026, 7, 10),
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
    type: CalendarRecordType.BankHoliday,
    from: isoDate(2026, 7, day),
    to: isoDate(2026, 7, day),
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
        type: CalendarRecordType.Vacation,
        from: isoDate(2026, 7, 8),
        to: isoDate(2026, 7, 8),
        vacationIds: ["v-8"],
      },
    ];

    render(<LeaveCalendar {...baseProps} ranges={ranges} />);

    expect(screen.getByText("🎉 First Holiday")).toBeInTheDocument();
    expect(screen.getByText("🎉 Second Holiday")).toBeInTheDocument();
    expect(screen.getByTitle("Dana Holt · Vacation")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("places a holiday pill in its date's column", () => {
    // 9 July 2026 is a Thursday.
    render(<LeaveCalendar {...baseProps} ranges={[bankDay(9, "Some Holiday")]} />);

    expect(screen.getByTitle("Some Holiday").parentElement).toHaveStyle({ gridColumn: "4 / 5" });
  });

  it("opens a popover with every full holiday name on click", async () => {
    const user = userEvent.setup();
    render(
      <LeaveCalendar
        {...baseProps}
        ranges={[bankDay(9, "Den vzniku samostatného československého státu · Second Holiday")]}
      />
    );

    await user.click(screen.getByTitle(/Den vzniku samostatného/));

    // The popover lists each merged same-day holiday on its own line.
    expect(
      screen.getByText("🎉 Den vzniku samostatného československého státu")
    ).toBeInTheDocument();
    expect(screen.getByText("🎉 Second Holiday")).toBeInTheDocument();
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
    type: CalendarRecordType.Vacation,
    from: isoDate(2026, 7, day),
    to: isoDate(2026, 7, day),
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
