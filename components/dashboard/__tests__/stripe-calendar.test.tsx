import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StripeCalendar } from "../stripe-calendar";
import type { CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import type { DayRecord } from "@/lib/calendar/stripes";
import { DEFAULT_LEAVE_TYPES } from "@/lib/demo/leave-meta";
import { isoDate } from "@/lib/calendar/month-grid";

const VIEWER = "u-viewer";
const people = {
  [VIEWER]: { id: VIEWER, name: "Zoe Viewer", initials: "ZV", avatarColor: "hsl(0 0% 50%)" },
  anna: { id: "anna", name: "Anna Adams", initials: "AA", avatarColor: "hsl(0 0% 40%)" },
  bob: { id: "bob", name: "Bob Brown", initials: "BB", avatarColor: "hsl(0 0% 30%)" },
  cleo: { id: "cleo", name: "Cleo Cole", initials: "CC", avatarColor: "hsl(0 0% 20%)" },
};

function rec(userId: keyof typeof people, day: number, extra: Partial<DayRecord> = {}): DayRecord {
  return {
    id: `v-${userId}-${day}`,
    userId,
    user: people[userId],
    type: CalendarRecordType.Vacation,
    date: isoDate(2026, 9, day),
    halfDay: false,
    pending: false,
    mirroredFrom: null,
    ...extra,
  };
}

const holiday: CalendarRange = {
  id: "bh-2026-09-28",
  who: "all",
  type: CalendarRecordType.BankHoliday,
  from: "2026-09-28",
  to: "2026-09-28",
  note: "St. Wenceslas Day",
  vacationIds: [],
};

function renderCalendar(
  records: DayRecord[],
  overrides: Partial<React.ComponentProps<typeof StripeCalendar>> = {}
) {
  const onOpenRequest = vi.fn();
  const onBook = vi.fn();
  render(
    <StripeCalendar
      year={2026}
      month={9}
      today={null}
      records={records}
      holidays={[holiday]}
      filter={new Set(DEFAULT_LEAVE_TYPES)}
      viewerId={VIEWER}
      onOpenRequest={onOpenRequest}
      onBook={onBook}
      {...overrides}
    />
  );
  return { onOpenRequest, onBook };
}

describe("StripeCalendar", () => {
  it("draws one stripe per booking and fades a pending one", () => {
    renderCalendar([rec("anna", 8), rec("anna", 9), rec("bob", 9, { pending: true })]);

    const stripes = screen.getAllByTestId("stripe");
    expect(stripes).toHaveLength(2);
    expect(stripes.filter((s) => s.dataset.pending)).toHaveLength(1);
  });

  it("places a stripe that crosses a week boundary by its dates", () => {
    renderCalendar([4, 5, 6, 7, 8].map((d) => rec("anna", d)));

    const stripes = screen.getAllByTestId("stripe");
    expect(stripes.map((s) => s.style.gridColumn)).toEqual(["5 / 8", "1 / 3"]);
  });

  it("numbers the adjacent-month days and labels the first one on each side", () => {
    renderCalendar([]);

    // 31 August leads the grid; 1-4 October close it.
    expect(screen.getAllByRole("button", { name: /August|September|October/ })).toHaveLength(35);
    expect(screen.getByRole("button", { name: /^Monday,? 31 August/ })).toHaveTextContent("31Aug");
    expect(screen.getByRole("button", { name: /^Thursday,? 1 October/ })).toHaveTextContent("1Oct");
    expect(screen.getByRole("button", { name: /^Friday,? 2 October/ })).toHaveTextContent(/^2$/);
  });

  it("draws a seam where the month changes mid-week", () => {
    renderCalendar([]);

    // 1 September is a Tuesday and 1 October a Thursday.
    expect(screen.getAllByTestId("month-seam").map((s) => s.dataset.col)).toEqual(["1", "3"]);
  });

  it("draws a booking that crosses the month boundary as one stripe", () => {
    renderCalendar([
      { ...rec("anna", 1), id: "v-aug", date: "2026-08-31" },
      rec("anna", 1),
      rec("anna", 2),
    ]);

    const stripes = screen.getAllByTestId("stripe");
    expect(stripes.map((s) => s.style.gridColumn)).toEqual(["1 / 4"]);
    expect(stripes[0].style.opacity).toBe("1");
  });

  it("books an adjacent-month day from its popover without leaving the month", async () => {
    const user = userEvent.setup();
    const { onBook } = renderCalendar([{ ...rec("anna", 1), id: "v-oct", date: "2026-10-02" }]);

    await user.click(screen.getByRole("button", { name: /^Friday,? 2 October/ }));
    const list = screen.getByRole("region", { name: /Away on Friday,? 2 October/ });
    expect(within(list).getByText(/Anna Adams/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Book Fri,? 2 Oct/ }));
    expect(onBook).toHaveBeenCalledWith("2026-10-02");
  });

  it("tints a bank holiday on an adjacent-month day", () => {
    renderCalendar([], {
      holidays: [{ ...holiday, id: "bh-2026-10-01", from: "2026-10-01", to: "2026-10-01" }],
    });

    expect(
      screen.getByRole("button", { name: /1 October, St. Wenceslas Day/ })
    ).toBeInTheDocument();
  });

  it("shows +N on a day whose bookings do not fit three stripes", () => {
    renderCalendar([rec(VIEWER, 9), rec("anna", 9), rec("bob", 9), rec("cleo", 9)]);

    expect(screen.getAllByTestId("stripe")).toHaveLength(3);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("opens the day list on click, the viewer first with the half-day and pending marks", async () => {
    const user = userEvent.setup();
    renderCalendar([
      rec("anna", 9, { pending: true }),
      rec(VIEWER, 9, { halfDay: true, type: CalendarRecordType.HomeOffice }),
    ]);

    await user.click(screen.getByRole("button", { name: /^Wednesday,? 9 September/ }));

    const list = screen.getByRole("region", { name: /Away on Wednesday,? 9 September/ });
    const rows = within(list).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Zoe Viewer (you)");
    expect(rows[0]).toHaveTextContent("½ day");
    expect(rows[1]).toHaveTextContent("Anna Adams");
    expect(rows[1]).toHaveTextContent("Pending");
    expect(within(list).getByText("2 away")).toBeInTheDocument();
  });

  it("opens the request detail from a row and books the day from the Book button", async () => {
    const user = userEvent.setup();
    const { onOpenRequest, onBook } = renderCalendar([rec("anna", 9)]);

    await user.click(screen.getByRole("button", { name: /^Wednesday,? 9 September/ }));
    await user.click(screen.getByRole("button", { name: /Anna Adams/ }));
    expect(onOpenRequest).toHaveBeenCalledWith("v-anna-9");

    await user.click(screen.getByRole("button", { name: /^Wednesday,? 9 September/ }));
    await user.click(screen.getByRole("button", { name: /^Book Wed,? 9 Sept?/ }));
    expect(onBook).toHaveBeenCalledWith("2026-09-09");
  });

  it("opens the day list with Enter on a focused cell", async () => {
    const user = userEvent.setup();
    renderCalendar([]);

    screen.getByRole("button", { name: /^Thursday,? 10 September/ }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByText("Nobody is away.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Book Thu,? 10 Sept?/ })).toBeInTheDocument();
  });

  it("opens the day list with Space on a focused cell", async () => {
    const user = userEvent.setup();
    renderCalendar([]);

    screen.getByRole("button", { name: /^Thursday,? 10 September/ }).focus();
    await user.keyboard(" ");

    expect(
      screen.getByRole("region", { name: /Away on Thursday,? 10 September/ })
    ).toBeInTheDocument();
  });

  it("applies the leave-type filter to the stripes and the day list", async () => {
    const user = userEvent.setup();
    renderCalendar([rec("anna", 9), rec("bob", 9, { type: CalendarRecordType.HomeOffice })], {
      filter: new Set([CalendarRecordType.HomeOffice]),
    });

    expect(screen.getAllByTestId("stripe")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /^Wednesday,? 9 September/ }));
    const list = screen.getByRole("region", { name: /Away on/ });
    expect(within(list).queryByText(/Anna Adams/)).not.toBeInTheDocument();
    expect(within(list).getByText(/Bob Brown/)).toBeInTheDocument();
  });

  it("tints a bank holiday and lists it first in the day list", async () => {
    const user = userEvent.setup();
    renderCalendar([]);

    const cell = screen.getByRole("button", { name: /28 September, St. Wenceslas Day/ });
    expect(within(cell).getByText("St. Wenceslas Day")).toBeInTheDocument();
    expect(screen.queryAllByTestId("stripe")).toHaveLength(0);

    await user.click(cell);
    const list = screen.getByRole("region", { name: /Away on/ });
    expect(within(list).getByText("St. Wenceslas Day")).toBeInTheDocument();
    expect(within(list).getByText("0 away")).toBeInTheDocument();
  });
});
