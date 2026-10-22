import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthRangeSelect } from "../month-range-select";
import { presetRange, type MonthSelection } from "@/lib/vacations/month-range";

const today = { year: 2026, month: 10 };

function Harness({ onChange }: { onChange?: (s: MonthSelection) => void }) {
  const [value, setValue] = useState<MonthSelection>(() => ({
    preset: "next3",
    range: presetRange("next3", today),
  }));
  return (
    <>
      <MonthRangeSelect
        value={value}
        today={today}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
      <output data-testid="range">
        {`${value.range.first.year}-${value.range.first.month}..${value.range.last.year}-${value.range.last.month}`}
      </output>
    </>
  );
}

describe("MonthRangeSelect", () => {
  it("offers the four presets with the given one selected", () => {
    render(<Harness />);

    for (const name of ["This month", "Next 3 months", "2026", "Custom…"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("tab", { name: "Next 3 months" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("selects this month and the current year from their presets", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("tab", { name: "This month" }));
    expect(screen.getByTestId("range")).toHaveTextContent("2026-10..2026-10");

    await user.click(screen.getByRole("tab", { name: "2026" }));
    expect(screen.getByTestId("range")).toHaveTextContent("2026-1..2026-12");

    await user.click(screen.getByRole("tab", { name: "Next 3 months" }));
    expect(screen.getByTestId("range")).toHaveTextContent("2026-10..2026-12");
  });

  it("opens Custom on the current range and picks months across a year boundary", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("tab", { name: "Custom…" }));
    expect(screen.getByRole("combobox", { name: "From" })).toHaveTextContent("Oct 2026");
    expect(screen.getByRole("combobox", { name: "To" })).toHaveTextContent("Dec 2026");

    await user.click(screen.getByRole("combobox", { name: "From" }));
    await user.click(screen.getByRole("option", { name: "Nov 2026" }));
    await user.click(screen.getByRole("combobox", { name: "To" }));
    await user.click(screen.getByRole("option", { name: "Jan 2027" }));

    expect(screen.getByTestId("range")).toHaveTextContent("2026-11..2027-1");
    expect(screen.getByRole("tab", { name: "Custom…" })).toHaveAttribute("aria-selected", "true");
  });

  it("lists January last year to December next year in each month select", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("tab", { name: "Custom…" }));
    await user.click(screen.getByRole("combobox", { name: "To" }));

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(36);
    expect(options[0]).toHaveTextContent("Jan 2025");
    expect(options[35]).toHaveTextContent("Dec 2027");
  });
});
