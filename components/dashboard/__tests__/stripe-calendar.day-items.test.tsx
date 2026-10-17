import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StripeCalendar } from "../stripe-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import type { DayRecord } from "@/lib/calendar/stripes";
import { dayItemsByDate, type DayItem } from "@/lib/calendar/day-items";
import { DEFAULT_LEAVE_TYPES } from "@/lib/demo/leave-meta";

const anna = { id: "anna", name: "Anna Adams", initials: "AA", avatarColor: "hsl(0 0% 40%)" };
const away: DayRecord = {
  id: "v-anna-9",
  userId: "anna",
  user: anna,
  type: CalendarRecordType.Vacation,
  date: "2026-09-09",
  halfDay: false,
  pending: false,
  mirroredFrom: null,
};
const birthdays: DayItem[] = [
  { key: "bd:petra", kind: "birthday", date: "2026-09-09", title: "Petra turns 34" },
  {
    key: "bd:me",
    kind: "birthday",
    date: "2026-09-09",
    title: "Your birthday · 38",
    detail: "Change in Settings",
    href: "/settings",
  },
];

const standup: DayItem = {
  key: "ge:standup",
  kind: "groupEvent",
  date: "2026-09-09",
  title: "Standup",
  card: { when: "Wed 9 Sep · 09:30–09:45", addedBy: "Added by Bob Dvorak", locked: "Only Bob" },
};

function renderCalendar(extra: Partial<Parameters<typeof StripeCalendar>[0]> = {}) {
  render(
    <StripeCalendar
      year={2026}
      month={9}
      today={null}
      records={[away]}
      holidays={[]}
      filter={new Set(DEFAULT_LEAVE_TYPES)}
      viewerId="u-viewer"
      onOpenRequest={vi.fn()}
      onBook={vi.fn()}
      dayItems={dayItemsByDate(birthdays)}
      {...extra}
    />
  );
}

describe("StripeCalendar day items", () => {
  it("marks a birthday day with a cake and names it in the day's label", () => {
    renderCalendar();

    const cell = screen.getByRole("button", { name: /^Wednesday,? 9 September/ });
    expect(cell).toHaveAccessibleName(expect.stringContaining("2 birthdays"));
    expect(cell.querySelector("[data-mark='birthday']")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /^Thursday,? 10 September/ }).querySelector("[data-mark]")
    ).toBeNull();
  });

  it("lists the day's birthdays above the people away", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole("button", { name: /^Wednesday,? 9 September/ }));

    const day = screen.getByRole("region", { name: /Away on Wednesday,? 9 September/ });
    const petra = within(day).getByText("Petra turns 34");
    const own = within(day).getByRole("link", { name: /Your birthday · 38/ });
    const annaRow = within(day).getByText("Anna Adams");
    expect(own).toHaveAttribute("href", "/settings");
    expect(petra.compareDocumentPosition(annaRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("marks group events with dots and lists them first, above the people away", async () => {
    const user = userEvent.setup();
    renderCalendar({ dayItems: dayItemsByDate([...birthdays, standup]) });

    const cell = screen.getByRole("button", { name: /^Wednesday,? 9 September/ });
    expect(cell).toHaveAccessibleName(expect.stringContaining("1 group event, 2 birthdays"));
    expect(cell.querySelectorAll("[data-mark='groupEvent']")).toHaveLength(1);
    await user.click(cell);

    const day = screen.getByRole("region", { name: /Away on Wednesday,? 9 September/ });
    const event = within(day).getByText("Standup");
    const petra = within(day).getByText("Petra turns 34");
    const annaRow = within(day).getByText("Anna Adams");
    expect(event.compareDocumentPosition(petra) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(petra.compareDocumentPosition(annaRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("offers a new group event on the day only when a handler is passed", async () => {
    const user = userEvent.setup();
    const onNewGroupEvent = vi.fn();
    renderCalendar({ onNewGroupEvent });

    await user.click(screen.getByRole("button", { name: /^Thursday,? 10 September/ }));
    await user.click(screen.getByRole("button", { name: "New group event on Thu 10 Sept" }));

    expect(onNewGroupEvent).toHaveBeenCalledWith("2026-09-10");
    expect(screen.queryByRole("region", { name: /Away on/ })).not.toBeInTheDocument();
  });

  it("offers no new group event without a handler", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole("button", { name: /^Thursday,? 10 September/ }));

    expect(screen.queryByRole("button", { name: /New group event/ })).not.toBeInTheDocument();
  });
});
