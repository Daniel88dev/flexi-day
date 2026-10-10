import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarLegend } from "../calendar-legend";
import type { CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";

function range(type: CalendarRecordType, id: string): CalendarRange {
  return { id, who: "u-1", type, from: "2026-06-03", to: "2026-06-04" };
}

const ranges = [
  range(CalendarRecordType.Vacation, "r1"),
  range(CalendarRecordType.StudyLeave, "r2"),
  range(CalendarRecordType.BankHoliday, "r3"),
];

const allTypes = new Set(Object.values(CalendarRecordType));

describe("CalendarLegend", () => {
  it("renders a swatch and label for exactly the types in view", () => {
    render(<CalendarLegend ranges={ranges} filter={allTypes} />);

    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      "Vacation",
      "Bank Holiday",
      "Study Leave",
      "Pending",
    ]);

    const study = screen.getByText("Study Leave");
    expect(study.querySelector("[aria-hidden]")?.getAttribute("style")).toContain("--c-study");
  });

  it("omits types the filter hides", () => {
    const filter = new Set([CalendarRecordType.Vacation, CalendarRecordType.BankHoliday]);
    render(<CalendarLegend ranges={ranges} filter={filter} />);

    expect(screen.queryByText("Study Leave")).not.toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });

  it("explains the pending look with a neutral dashed swatch even when nothing is pending", () => {
    render(<CalendarLegend ranges={ranges} filter={allTypes} />);

    const swatch = screen.getByText("Pending").querySelector("[aria-hidden]");
    expect(swatch).toHaveClass("border-dashed");
    expect(swatch?.getAttribute("style") ?? "").not.toContain("--c-");
  });

  it("renders nothing when the filter hides every type in view", () => {
    const filter = new Set([CalendarRecordType.Sick]);
    const { container } = render(<CalendarLegend ranges={ranges} filter={filter} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no ranges are in view", () => {
    const { container } = render(<CalendarLegend ranges={[]} filter={allTypes} />);
    expect(container).toBeEmptyDOMElement();
  });
});
