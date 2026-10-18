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

function renderCalendar() {
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
});
