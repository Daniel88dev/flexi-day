import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveCalendar, type CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import { BOOKED_FILL, RANGE_FILL } from "@/lib/calendar/drag-range";

// October 2026 opens on a Thursday: the grid runs 28 September to 1 November.
const baseProps = { year: 2026, month: 10 } as const;
const VIEWER = "u-me";

const ranges: CalendarRange[] = [
  {
    id: "mine",
    who: VIEWER,
    user: { id: VIEWER, name: "Olivia Owner", initials: "OO", avatarColor: "hsl(200 60% 55%)" },
    type: CalendarRecordType.HomeOffice,
    from: "2026-10-14",
    to: "2026-10-15",
    vacationIds: ["v-14", "v-15"],
    pending: true,
  },
  {
    id: "pat",
    who: "u-pat",
    user: { id: "u-pat", name: "Pat Lee", initials: "PL", avatarColor: "hsl(280 55% 62%)" },
    type: CalendarRecordType.Vacation,
    from: "2026-10-12",
    to: "2026-10-16",
    vacationIds: ["v-pat"],
  },
  {
    id: "holiday",
    who: "all",
    type: CalendarRecordType.BankHoliday,
    from: "2026-10-28",
    to: "2026-10-28",
    note: "Independence Day",
  },
];

function stubViewport({ width, mouse = true }: { width: number; mouse?: boolean }) {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const wide = width >= 768;
    const matches = query.includes("pointer: fine") ? wide && mouse : wide;
    return {
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList;
  });
}

const day = (label: string) => screen.getByRole("button", { name: `Create request for ${label}` });
const mouse = { pointerType: "mouse", button: 0, clientX: 100, clientY: 100 };

function renderCalendar() {
  const onRangeSelect = vi.fn();
  const onDayClick = vi.fn();
  const onSelect = vi.fn();
  render(
    <LeaveCalendar
      {...baseProps}
      ranges={ranges}
      viewerId={VIEWER}
      onRangeSelect={onRangeSelect}
      onDayClick={onDayClick}
      onSelect={onSelect}
    />
  );
  return { onRangeSelect, onDayClick, onSelect };
}

describe("LeaveCalendar", () => {
  beforeEach(() => stubViewport({ width: 1280 }));
  afterEach(() => vi.restoreAllMocks());

  it("selects the dragged range across week rows on release, not a single day", () => {
    const { onRangeSelect, onDayClick } = renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);
    fireEvent.pointerUp(day("15 October"), mouse);
    fireEvent.click(day("15 October"));

    expect(onRangeSelect).toHaveBeenCalledExactlyOnceWith({
      from: "2026-10-07",
      to: "2026-10-15",
    });
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("lets a drag reach the adjacent-month days in the grid", () => {
    const { onRangeSelect } = renderCalendar();

    fireEvent.pointerDown(day("2 October"), mouse);
    fireEvent.pointerMove(day("28 September"), mouse);
    fireEvent.pointerUp(document.body, mouse);

    expect(onRangeSelect).toHaveBeenCalledWith({ from: "2026-09-28", to: "2026-10-02" });
  });

  it("washes the dragged range, fills the viewer's booked days red, and leaves the rest", () => {
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

  it("shows a drag label with working days and the booked count", () => {
    renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);

    expect(screen.getByTestId("drag-range-label")).toHaveTextContent(/7\s–\s15 Oct · 7 days/);
    expect(screen.getByText("2 already booked")).toBeInTheDocument();
  });

  it("skips bank holidays in the drag label's count", () => {
    renderCalendar();

    fireEvent.pointerDown(day("26 October"), mouse);
    fireEvent.pointerMove(day("30 October"), mouse);

    expect(screen.getByTestId("drag-range-label")).toHaveTextContent(/· 4 days$/);
  });

  it("drops the colour fade, bar hits and text selection while dragging, and restores them", () => {
    renderCalendar();
    const bar = screen.getByTitle("Pat Lee · Vacation");
    expect(day("7 October")).toHaveClass("transition-colors");
    expect(bar.parentElement).toHaveStyle({ pointerEvents: "auto" });

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);

    expect(day("7 October")).not.toHaveClass("transition-colors");
    expect(bar.parentElement).toHaveStyle({ pointerEvents: "none" });
    expect(screen.getByTestId("leave-calendar")).toHaveStyle({ userSelect: "none" });

    fireEvent.pointerUp(day("15 October"), mouse);

    expect(day("7 October")).toHaveClass("transition-colors");
    expect(bar.parentElement).toHaveStyle({ pointerEvents: "auto" });
    expect(screen.queryByTestId("drag-range-label")).toBeNull();
  });

  it("keeps a press on a bar opening its request instead of starting a drag", () => {
    const { onRangeSelect, onSelect } = renderCalendar();
    const bar = screen.getByTitle("Pat Lee · Vacation");

    fireEvent.pointerDown(bar, mouse);
    fireEvent.pointerMove(day("20 October"), mouse);
    fireEvent.pointerUp(bar, mouse);
    fireEvent.click(bar);

    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith("v-pat");
  });

  it("keeps a click without drag movement booking one day", () => {
    const { onRangeSelect, onDayClick } = renderCalendar();

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerUp(day("7 October"), mouse);
    fireEvent.click(day("7 October"));

    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(onDayClick).toHaveBeenCalledExactlyOnceWith("2026-10-07");
  });

  it("still focuses the day cell on a plain mouse click when dragging is on", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(day("7 October"));

    expect(day("7 October")).toHaveFocus();
  });

  it("shows the drag crosshair cue to a mouse on the desktop layout", () => {
    renderCalendar();
    expect(day("7 October")).toHaveStyle({ cursor: "cell" });
  });

  it("keeps the pointer cursor and never drags below 768px", () => {
    vi.restoreAllMocks();
    stubViewport({ width: 700 });
    const { onRangeSelect, onDayClick } = renderCalendar();
    expect(day("7 October")).toHaveStyle({ cursor: "pointer" });

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);
    fireEvent.pointerUp(day("15 October"), mouse);

    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(day("7 October").style.background).not.toBe(RANGE_FILL);
    fireEvent.click(day("7 October"));
    expect(onDayClick).toHaveBeenCalledWith("2026-10-07");
  });

  it("never drags from touch", () => {
    vi.restoreAllMocks();
    stubViewport({ width: 1024, mouse: false });
    const { onRangeSelect } = renderCalendar();
    expect(day("7 October")).toHaveStyle({ cursor: "pointer" });

    fireEvent.pointerDown(day("7 October"), { ...mouse, pointerType: "touch" });
    fireEvent.pointerMove(day("15 October"), { ...mouse, pointerType: "touch" });
    fireEvent.pointerUp(day("15 October"), { ...mouse, pointerType: "touch" });

    expect(onRangeSelect).not.toHaveBeenCalled();
  });

  it("does nothing on drag without onRangeSelect", () => {
    const onDayClick = vi.fn();
    render(<LeaveCalendar {...baseProps} ranges={ranges} onDayClick={onDayClick} />);
    expect(day("7 October")).toHaveStyle({ cursor: "pointer" });

    fireEvent.pointerDown(day("7 October"), mouse);
    fireEvent.pointerMove(day("15 October"), mouse);

    expect(screen.queryByTestId("drag-range-label")).toBeNull();
  });
});
