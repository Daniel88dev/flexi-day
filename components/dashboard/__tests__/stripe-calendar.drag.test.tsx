import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StripeCalendar } from "../stripe-calendar";
import type { CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import type { DayRecord } from "@/lib/calendar/stripes";
import { DEFAULT_LEAVE_TYPES } from "@/lib/demo/leave-meta";
import { BOOKED_FILL, RANGE_FILL } from "@/lib/calendar/drag-range";
import { mouse, stubViewport } from "./drag-test-setup";

// October 2026 opens on a Thursday: the grid runs 28 September to 1 November.
const VIEWER = "u-me";

function rec(userId: string, date: string, extra: Partial<DayRecord> = {}): DayRecord {
  return {
    id: `v-${userId}-${date}`,
    userId,
    type: CalendarRecordType.Vacation,
    date,
    halfDay: false,
    pending: false,
    mirroredFrom: null,
    ...extra,
  };
}

const records: DayRecord[] = [
  rec(VIEWER, "2026-10-14", { type: CalendarRecordType.HomeOffice, pending: true }),
  rec(VIEWER, "2026-10-15", { type: CalendarRecordType.HomeOffice, pending: true }),
  ...["12", "13", "14", "15", "16"].map((d) => rec("u-pat", `2026-10-${d}`)),
];

const holidays: CalendarRange[] = [
  {
    id: "bh-2026-10-28",
    who: "all",
    type: CalendarRecordType.BankHoliday,
    from: "2026-10-28",
    to: "2026-10-28",
    note: "Independence Day",
    vacationIds: [],
  },
];

const day = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^\\w+,? ${label}(,|$)`) });
const dayList = () => screen.queryByRole("region", { name: /Away on/ });

function renderCalendar(overrides: Partial<React.ComponentProps<typeof StripeCalendar>> = {}) {
  const onRangeSelect = vi.fn();
  const onBook = vi.fn();
  render(
    <StripeCalendar
      year={2026}
      month={10}
      today={null}
      records={records}
      holidays={holidays}
      filter={new Set(DEFAULT_LEAVE_TYPES)}
      viewerId={VIEWER}
      onOpenRequest={vi.fn()}
      onBook={onBook}
      onRangeSelect={onRangeSelect}
      {...overrides}
    />
  );
  return { onRangeSelect, onBook };
}

describe("StripeCalendar", () => {
  beforeEach(() => stubViewport({ width: 1280 }));
  afterEach(() => vi.restoreAllMocks());

  it("selects the dragged range across week rows on release and never opens the popover", () => {
    const { onRangeSelect, onBook } = renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);
    fireEvent.pointerUp(day("15 October"), mouse);
    fireEvent.click(day("15 October"));

    expect(onRangeSelect).toHaveBeenCalledExactlyOnceWith({
      from: "2026-10-07",
      to: "2026-10-15",
    });
    expect(onBook).not.toHaveBeenCalled();
    expect(dayList()).toBeNull();
  });

  it("keeps a click without drag movement opening the day's popover with its Book button", async () => {
    const user = userEvent.setup();
    const { onRangeSelect, onBook } = renderCalendar();

    await user.click(day("7 October"));

    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(dayList()).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Book Wed,? 7 Oct/ }));
    expect(onBook).toHaveBeenCalledWith("2026-10-07");
  });

  it("leaves the popover shut on the press that starts a drag", () => {
    renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    expect(dayList()).toBeNull();
    fireEvent.pointerMove(day("9 October"), mouse);
    expect(dayList()).toBeNull();
    expect(day("7 October")).toHaveAttribute("aria-pressed", "false");
  });

  it("opens no popover when a drag comes back to the day it started on", () => {
    const { onRangeSelect } = renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("9 October"), mouse);
    fireEvent.pointerMove(day("7 October"), mouse);
    fireEvent.pointerUp(day("7 October"), mouse);
    fireEvent.click(day("7 October"));

    expect(onRangeSelect).toHaveBeenCalledWith({ from: "2026-10-07", to: "2026-10-07" });
    expect(dayList()).toBeNull();
    expect(day("7 October")).toHaveAttribute("aria-pressed", "false");
  });

  it("closes an open popover as soon as a drag from its day moves to another day", async () => {
    const user = userEvent.setup();
    renderCalendar();
    await user.click(day("7 October"));
    expect(dayList()).toBeInTheDocument();

    fireEvent.pointerDown(day("7 October"), mouse);
    expect(dayList()).toBeInTheDocument();
    fireEvent.pointerMove(day("9 October"), mouse);
    expect(dayList()).toBeNull();

    fireEvent.pointerUp(day("9 October"), mouse);
    expect(dayList()).toBeNull();
  });

  it("washes the dragged range and fills the viewer's booked days red", () => {
    renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);

    expect(day("7 October").style.background).toBe(RANGE_FILL);
    // A weekend cell in range loses its own tint to the wash.
    expect(day("10 October").style.background).toBe(RANGE_FILL);
    // Pat's days are not the viewer's.
    expect(day("12 October").style.background).toBe(RANGE_FILL);
    expect(day("14 October").style.background).toBe(BOOKED_FILL);
    expect(day("15 October").style.background).toBe(BOOKED_FILL);
    expect(day("16 October").style.background).not.toBe(RANGE_FILL);
    expect(day("6 October").style.background).not.toBe(RANGE_FILL);
  });

  it("keeps a holiday's name in its cell under the drag wash", () => {
    renderCalendar();

    fireEvent.pointerDown(day("26 October"), mouse);
    fireEvent.pointerMove(day("30 October"), mouse);

    const cell = day("28 October");
    expect(cell.style.background).toBe(RANGE_FILL);
    expect(within(cell).getByText("Independence Day")).toBeVisible();
  });

  it("lets a drag reach the adjacent-month days in the grid", () => {
    const { onRangeSelect } = renderCalendar();

    fireEvent.pointerDown(day("2 October"), mouse);
    fireEvent.pointerMove(day("28 September"), mouse);
    fireEvent.pointerUp(document.body, mouse);

    expect(onRangeSelect).toHaveBeenCalledWith({ from: "2026-09-28", to: "2026-10-02" });
  });

  it("shows the drag label with working days, skipping holidays, and the booked count", () => {
    renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);
    expect(screen.getByTestId("drag-range-label")).toHaveTextContent(/7\s–\s15 Oct · 7 days/);
    expect(screen.getByText("2 already booked")).toBeInTheDocument();

    fireEvent.pointerMove(day("30 October"), mouse);
    expect(screen.getByTestId("drag-range-label")).toHaveTextContent(/· 17 days/);
  });

  it("drops the colour fade and text selection while dragging, and restores them", () => {
    renderCalendar();
    expect(day("7 October")).toHaveClass("transition-colors");

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);

    expect(day("7 October")).not.toHaveClass("transition-colors");
    expect(screen.getByTestId("stripe-calendar")).toHaveStyle({ userSelect: "none" });

    fireEvent.pointerUp(day("15 October"), mouse);

    expect(day("7 October")).toHaveClass("transition-colors");
    expect(screen.queryByTestId("drag-range-label")).toBeNull();
  });

  it("cancels a drag on Escape without selecting or opening the popover", () => {
    const { onRangeSelect } = renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("drag-range-label")).toBeNull();
    fireEvent.pointerUp(day("15 October"), mouse);
    fireEvent.click(day("15 October"));

    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(dayList()).toBeNull();
  });

  it("shows the drag crosshair cue to a mouse on the desktop layout", () => {
    renderCalendar();
    expect(day("7 October")).toHaveStyle({ cursor: "cell" });
  });

  it("keeps the pointer cursor and never drags below 768px", async () => {
    vi.restoreAllMocks();
    stubViewport({ width: 700 });
    const { onRangeSelect } = renderCalendar();
    expect(day("7 October")).not.toHaveStyle({ cursor: "cell" });

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);
    fireEvent.pointerUp(day("15 October"), mouse);

    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(day("7 October").style.background).not.toBe(RANGE_FILL);
    await userEvent.setup().click(day("7 October"));
    expect(dayList()).toBeInTheDocument();
  });

  it("never drags from touch", () => {
    vi.restoreAllMocks();
    stubViewport({ width: 1024, mouse: false });
    const { onRangeSelect } = renderCalendar();
    expect(day("7 October")).not.toHaveStyle({ cursor: "cell" });

    const touch = { ...mouse, pointerType: "touch" };
    fireEvent.pointerDown(day("7 October"), touch);
    fireEvent.pointerMove(day("15 October"), touch);
    expect(day("7 October").style.background).not.toBe(RANGE_FILL);
    fireEvent.pointerUp(day("15 October"), touch);

    expect(onRangeSelect).not.toHaveBeenCalled();
  });

  it("does nothing on drag without onRangeSelect", () => {
    renderCalendar({ onRangeSelect: undefined });
    expect(day("7 October")).not.toHaveStyle({ cursor: "cell" });

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);

    expect(screen.queryByTestId("drag-range-label")).toBeNull();
  });
});
