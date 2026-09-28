import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayList } from "../day-list";
import { CalendarRecordType } from "@/lib/api/types";
import type { DayRecord } from "@/lib/calendar/stripes";

const anna: DayRecord = {
  id: "v-anna",
  userId: "anna",
  user: { id: "anna", name: "Anna Adams", initials: "AA", avatarColor: "hsl(0 0% 40%)" },
  type: CalendarRecordType.Vacation,
  day: 9,
  halfDay: false,
  pending: false,
  mirroredFrom: null,
};

function renderList(entries: DayRecord[], holiday?: string) {
  const onOpenRequest = vi.fn();
  const onBook = vi.fn();
  render(
    <DayList
      title="Wednesday 9 September"
      shortDate="Wed 9 Sept"
      entries={entries}
      holiday={holiday}
      viewerId="u-viewer"
      onOpenRequest={onOpenRequest}
      onBook={onBook}
    />
  );
  return { onOpenRequest, onBook };
}

describe("DayList", () => {
  it("renders the date, the away count and a row per entry", () => {
    renderList([anna, { ...anna, id: "v-anna-2", type: CalendarRecordType.HomeOffice }]);

    expect(screen.getByRole("heading", { name: "Wednesday 9 September" })).toBeInTheDocument();
    expect(screen.getByText("1 away")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows the holiday row and the empty message on a day nobody is away", () => {
    renderList([], "St. Wenceslas Day");

    expect(screen.getByText("St. Wenceslas Day")).toBeInTheDocument();
    expect(screen.getByText("Nobody is away.")).toBeInTheDocument();
  });

  it("calls onOpenRequest for a row and onBook for the Book button", async () => {
    const user = userEvent.setup();
    const { onOpenRequest, onBook } = renderList([anna]);

    await user.click(screen.getByRole("button", { name: /Anna Adams/ }));
    await user.click(screen.getByRole("button", { name: "Book Wed 9 Sept" }));

    expect(onOpenRequest).toHaveBeenCalledWith("v-anna");
    expect(onBook).toHaveBeenCalledOnce();
  });
});
