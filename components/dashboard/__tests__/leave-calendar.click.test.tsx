import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveCalendar, type CalendarRange } from "../leave-calendar";
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
