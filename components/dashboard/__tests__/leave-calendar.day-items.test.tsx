import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveCalendar, type CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import { dayItemsByDate, type DayItem } from "@/lib/calendar/day-items";
import { groupEventDayItems } from "@/lib/group-events/day-items";
import type { GroupEventRow } from "@/lib/api/group-events";
import { en } from "@/lib/i18n/dictionaries/en";

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

function event(id: string, title: string, patch: Partial<GroupEventRow> = {}): GroupEventRow {
  return {
    id,
    groupId: "g-1",
    groupName: "Dev Team",
    title,
    note: null,
    startDate: DAY,
    endDate: DAY,
    startTime: null,
    endTime: null,
    repeat: null,
    skippedDates: [],
    recurringEventId: null,
    originalDate: null,
    createdBy: null,
    canEdit: false,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...patch,
  };
}

function eventItems(rows: GroupEventRow[]): DayItem[] {
  return groupEventDayItems(
    rows,
    { from: "2026-06-29", to: "2026-08-09" },
    { viewerId: null, showGroup: false, t: en }
  );
}

function ribbonDays(container: HTMLElement): string[] {
  return [...container.querySelectorAll("[data-ribbon]")].map(
    (r) => r.getAttribute("data-ribbon") ?? ""
  );
}

describe("LeaveCalendar day items", () => {
  it("keeps both booking lanes on a day with three group events and a birthday", () => {
    render(
      <LeaveCalendar
        year={2026}
        month={7}
        ranges={[bar("dana", "Dana Holt"), bar("sam", "Sam Ruiz")]}
        dayItems={dayItemsByDate([
          ...eventItems([
            event("a", "Offsite", { startDate: "2026-07-07", endDate: "2026-07-09" }),
            event("b", "Retro"),
            event("c", "Planning", { startTime: "10:00", endTime: "11:00" }),
          ]),
          birthday,
        ])}
      />
    );

    expect(screen.getByTitle("Dana Holt · Vacation")).toBeInTheDocument();
    expect(screen.getByTitle("Sam Ruiz · Vacation")).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    const chip = screen.getByRole("button", { name: "3 group events, 1 birthday on 8 July" });
    expect(chip).toHaveTextContent("Retro");
    expect(chip).toHaveTextContent("+2");
  });

  it("draws the ribbon on every day a multi-day event covers, across the week break", () => {
    const { container } = render(
      <LeaveCalendar
        year={2026}
        month={7}
        ranges={[]}
        dayItems={dayItemsByDate(
          eventItems([event("a", "Offsite", { startDate: "2026-07-11", endDate: "2026-07-14" })])
        )}
      />
    );

    expect(ribbonDays(container)).toEqual(["2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14"]);
  });

  it("shows a recurring event on each occurrence and not on a skipped date", () => {
    render(
      <LeaveCalendar
        year={2026}
        month={7}
        ranges={[]}
        dayItems={dayItemsByDate(
          eventItems([
            event("s", "Standup", {
              startDate: "2026-07-06",
              endDate: "2026-07-06",
              repeat: {
                freq: "weekly",
                interval: 1,
                weekdays: [0],
                monthlyMode: null,
                until: null,
              },
              skippedDates: ["2026-07-20"],
            }),
          ])
        )}
      />
    );

    const chips = screen.getAllByRole("button", { name: /^1 group event on/ });
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "1 group event on 6 July",
      "1 group event on 13 July",
      "1 group event on 27 July",
    ]);
  });

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
