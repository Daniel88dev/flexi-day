import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ADJACENT_DAY_COLOR,
  ADJACENT_DAY_TINT,
  DayHeading,
  MonthSeam,
  dayNumberColor,
  dayTint,
} from "../month-seam";

describe("MonthSeam", () => {
  it("sits on the left edge of its column", () => {
    render(<MonthSeam col={3} />);

    const seam = screen.getByTestId("month-seam");
    expect(seam.style.left).toMatch(/^calc\(42\.857\d*% - 1px\)$/);
  });
});

describe("DayHeading", () => {
  it("renders the day number with the short month name of a labelled date", () => {
    render(<DayHeading labelDate="2026-12-01">1</DayHeading>);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
  });

  it("renders the number alone without a labelled date", () => {
    const { container } = render(<DayHeading labelDate={null}>2</DayHeading>);

    expect(container).toHaveTextContent(/^2$/);
  });
});

describe("dayNumberColor", () => {
  it("fades an adjacent-month number below a weekend one", () => {
    expect(dayNumberColor({ isToday: false, inMonth: false, isWeekend: true })).toBe(
      ADJACENT_DAY_COLOR
    );
    expect(dayNumberColor({ isToday: false, inMonth: true, isWeekend: true })).toBe(
      "var(--text-faint)"
    );
    expect(dayNumberColor({ isToday: false, inMonth: true, isWeekend: false })).toBe(
      "var(--text-muted)"
    );
  });

  it("lets today and the selected day win over the month", () => {
    expect(dayNumberColor({ isToday: true, inMonth: false, isWeekend: false })).toBe(
      "var(--primary-fg)"
    );
    expect(
      dayNumberColor({ isToday: false, isSelected: true, inMonth: false, isWeekend: false })
    ).toBe("var(--surface)");
  });
});

describe("dayTint", () => {
  it("tints adjacent-month days, then weekends, and leaves weekdays bare", () => {
    expect(dayTint({ inMonth: false, isWeekend: false })).toBe(ADJACENT_DAY_TINT);
    expect(dayTint({ inMonth: true, isWeekend: true })).toBe(
      "color-mix(in oklch, var(--surface-2) 45%, transparent)"
    );
    expect(dayTint({ inMonth: true, isWeekend: false })).toBeUndefined();
  });
});
