import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveCalendar, type CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import { dayItemsByDate, type DayItem } from "@/lib/calendar/day-items";

const DAY = "2026-07-08";

function bar(id: string, name: string): CalendarRange {
  return {
    id,
    who: id,
    user: { id, name, initials: "XX", avatarColor: "hsl(0 0% 50%)" },
    type: CalendarRecordType.Vacation,
    from: DAY,
    to: DAY,
    vacationIds: [`v-${id}`],
  };
}

const birthday: DayItem = {
  key: "bd:petra",
  kind: "birthday",
  date: DAY,
  title: "Petra turns 34",
  detail: "Petra Nová",
};

describe("LeaveCalendar day items", () => {
  it("keeps both booking lanes on a day with a birthday", () => {
    render(
      <LeaveCalendar
        year={2026}
        month={7}
        ranges={[bar("dana", "Dana Holt"), bar("sam", "Sam Ruiz")]}
        dayItems={dayItemsByDate([birthday])}
      />
    );

    expect(screen.getByTitle("Dana Holt · Vacation")).toBeInTheDocument();
    expect(screen.getByTitle("Sam Ruiz · Vacation")).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 birthday on 8 July" })).toBeInTheDocument();
  });

  it("opens the birthdays without booking the day", async () => {
    const user = userEvent.setup();
    const onDayClick = vi.fn();
    render(
      <LeaveCalendar
        year={2026}
        month={7}
        ranges={[]}
        dayItems={dayItemsByDate([birthday])}
        onDayClick={onDayClick}
        onRangeSelect={() => {}}
      />
    );

    const chip = screen.getByRole("button", { name: "1 birthday on 8 July" });
    expect(screen.getByRole("button", { name: "Create request for 8 July" })).not.toContainElement(
      chip
    );

    await user.click(chip);
    await user.click(screen.getByText("Petra turns 34"));

    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("puts no chip on a day without items", () => {
    render(<LeaveCalendar year={2026} month={7} ranges={[]} dayItems={new Map()} />);
    expect(screen.queryByRole("button", { name: /birthday/ })).not.toBeInTheDocument();
  });
});
