import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useDragRange } from "../use-drag-range";
import type { DateRange } from "@/lib/calendar/drag-range";

const noop = () => {};
const DATES = ["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06"];

function Harness({
  onSelect,
  onDayClick = noop,
}: {
  onSelect: (range: DateRange) => void;
  onDayClick?: (date: string) => void;
}) {
  const drag = useDragRange(onSelect);
  return (
    <div>
      <output data-testid="range">
        {drag.range ? `${drag.range.from}..${drag.range.to}` : ""}
      </output>
      {DATES.map((date) => (
        <div
          key={date}
          data-testid={date}
          {...drag.cellProps(date)}
          onClick={() => {
            if (!drag.isClickSuppressed()) onDayClick(date);
          }}
        >
          <span data-testid={`${date}-number`}>{date.slice(8)}</span>
        </div>
      ))}
      <div data-testid="bar" onClick={() => onDayClick("bar")} />
      <div data-testid="outside" />
    </div>
  );
}

function stubViewport(width: number) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("min-width: 768px") ? width >= 768 : false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
}

const mouse = { pointerType: "mouse", button: 0 };
const cell = (date: string) => screen.getByTestId(date);

function drag(from: string, ...over: string[]) {
  fireEvent.pointerDown(cell(from), mouse);
  for (const date of over) fireEvent.pointerMove(screen.getByTestId(date), mouse);
}

describe("useDragRange", () => {
  beforeEach(() => stubViewport(1280));
  afterEach(() => vi.restoreAllMocks());

  it("selects the range from the pressed day to the day released on", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    drag("2026-10-01", "2026-10-02", "2026-10-05");
    expect(screen.getByTestId("range")).toHaveTextContent("2026-10-01..2026-10-05");
    fireEvent.pointerUp(cell("2026-10-05"), mouse);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith({ from: "2026-10-01", to: "2026-10-05" });
    expect(screen.getByTestId("range")).toHaveTextContent("");
  });

  it("gives the same range for a backward drag", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    drag("2026-10-05", "2026-10-01");
    fireEvent.pointerUp(cell("2026-10-01"), mouse);

    expect(onSelect).toHaveBeenCalledWith({ from: "2026-10-01", to: "2026-10-05" });
  });

  it("follows the pointer over a cell's own content", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    drag("2026-09-30", "2026-10-02-number");
    fireEvent.pointerUp(document.body, mouse);

    expect(onSelect).toHaveBeenCalledWith({ from: "2026-09-30", to: "2026-10-02" });
  });

  it("keeps the range up to the last day hovered when released outside the grid", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    drag("2026-10-01", "2026-10-06", "outside");
    expect(screen.getByTestId("range")).toHaveTextContent("2026-10-01..2026-10-06");
    fireEvent.pointerUp(screen.getByTestId("outside"), mouse);

    expect(onSelect).toHaveBeenCalledWith({ from: "2026-10-01", to: "2026-10-06" });
  });

  it("cancels on Escape and selects nothing on release", () => {
    const onSelect = vi.fn();
    const onDayClick = vi.fn();
    render(<Harness onSelect={onSelect} onDayClick={onDayClick} />);

    drag("2026-10-01", "2026-10-05");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("range")).toHaveTextContent("");
    fireEvent.pointerMove(cell("2026-10-06"), mouse);
    fireEvent.pointerUp(cell("2026-10-01"), mouse);
    fireEvent.click(cell("2026-10-01"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("leaves a click without movement to the cell", () => {
    const onSelect = vi.fn();
    const onDayClick = vi.fn();
    render(<Harness onSelect={onSelect} onDayClick={onDayClick} />);

    fireEvent.pointerDown(cell("2026-10-02"), mouse);
    fireEvent.pointerMove(cell("2026-10-02"), mouse);
    fireEvent.pointerUp(cell("2026-10-02"), mouse);
    fireEvent.click(cell("2026-10-02"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDayClick).toHaveBeenCalledExactlyOnceWith("2026-10-02");
  });

  it("swallows the click that ends a drag released on its first day", () => {
    const onSelect = vi.fn();
    const onDayClick = vi.fn();
    render(<Harness onSelect={onSelect} onDayClick={onDayClick} />);

    drag("2026-10-02", "2026-10-05", "2026-10-02");
    fireEvent.pointerUp(cell("2026-10-02"), mouse);
    fireEvent.click(cell("2026-10-02"));

    expect(onSelect).toHaveBeenCalledWith({ from: "2026-10-02", to: "2026-10-02" });
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("never starts from touch or a pen", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    for (const pointerType of ["touch", "pen"]) {
      fireEvent.pointerDown(cell("2026-10-01"), { pointerType, button: 0 });
      fireEvent.pointerMove(cell("2026-10-05"), { pointerType });
      expect(screen.getByTestId("range")).toHaveTextContent("");
      fireEvent.pointerUp(cell("2026-10-05"), { pointerType });
    }

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("never starts below 768px", () => {
    vi.restoreAllMocks();
    stubViewport(700);
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    drag("2026-10-01", "2026-10-05");
    fireEvent.pointerUp(cell("2026-10-05"), mouse);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("never starts from a secondary button", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    fireEvent.pointerDown(cell("2026-10-01"), { pointerType: "mouse", button: 2 });
    fireEvent.pointerMove(cell("2026-10-05"), mouse);
    fireEvent.pointerUp(cell("2026-10-05"), mouse);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("never starts from a press on a bar, even when the mouse then crosses days", () => {
    const onSelect = vi.fn();
    const onDayClick = vi.fn();
    render(<Harness onSelect={onSelect} onDayClick={onDayClick} />);

    fireEvent.pointerDown(screen.getByTestId("bar"), mouse);
    fireEvent.pointerMove(cell("2026-10-05"), mouse);
    expect(screen.getByTestId("range")).toHaveTextContent("");
    fireEvent.pointerUp(screen.getByTestId("bar"), mouse);
    fireEvent.click(screen.getByTestId("bar"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDayClick).toHaveBeenCalledWith("bar");
  });

  it("tracks the pointer for the cursor label while dragging", () => {
    function Probe() {
      const drag = useDragRange(noop);
      return (
        <>
          <output data-testid="pointer">
            {drag.pointer ? `${drag.pointer.x},${drag.pointer.y}` : ""}
          </output>
          <div data-testid="d" {...drag.cellProps("2026-10-01")} />
        </>
      );
    }
    render(
      <>
        <Probe />
        <div data-testid="e" data-drag-date="2026-10-02" />
      </>
    );

    fireEvent.pointerDown(screen.getByTestId("d"), { ...mouse, clientX: 10, clientY: 20 });
    fireEvent.pointerMove(screen.getByTestId("e"), { ...mouse, clientX: 140, clientY: 60 });

    expect(screen.getByTestId("pointer")).toHaveTextContent("140,60");
  });
});
