import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AttendanceDay } from "@/lib/api/attendance";
import { BalanceChip, DayFigures, DayFlags, Stat, StatRow } from "../attendance-figures";

const day = (overrides: Partial<AttendanceDay> = {}): AttendanceDay => ({
  businessDate: "2026-09-07",
  presenceMinutes: 510,
  breaksMinutes: 20,
  deductedMinutes: 30,
  workedMinutes: 480,
  requiredMinutes: 480,
  balanceMinutes: 0,
  upcoming: false,
  open: false,
  autoClosed: false,
  flagged: false,
  sessions: [],
  ...overrides,
});

describe("Stat", () => {
  it("renders a figure with its label and aside", () => {
    render(
      <StatRow>
        <Stat label="Worked" value="8:00" sub="so far" />
      </StatRow>
    );

    expect(screen.getByText("Worked")).toBeInTheDocument();
    expect(screen.getByText("8:00")).toBeInTheDocument();
    expect(screen.getByText("so far")).toBeInTheDocument();
  });
});

describe("BalanceChip", () => {
  it("signs a balance in both directions", () => {
    const { rerender } = render(<BalanceChip minutes={25} />);
    expect(screen.getByText("+0:25")).toBeInTheDocument();

    rerender(<BalanceChip minutes={-25} />);
    expect(screen.getByText("-0:25")).toBeInTheDocument();
  });
});

describe("DayFlags", () => {
  it("names a day the sweep closed and one still running", () => {
    render(<DayFlags day={day({ autoClosed: true, open: true })} today="2026-09-07" />);

    expect(screen.getByText("Auto-closed")).toBeInTheDocument();
    expect(screen.getByText("Still open")).toBeInTheDocument();
  });

  it("says nothing about an ordinary closed day", () => {
    const { container } = render(<DayFlags day={day()} today="2026-09-07" />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("DayFigures", () => {
  it("reads worked against required, with what was present", () => {
    render(
      <DayFigures
        day={day({ workedMinutes: 450, balanceMinutes: -30 })}
        mode="DAILY"
        today={null}
      />
    );

    expect(screen.getByText("7:30")).toBeInTheDocument();
    expect(screen.getByText("of 8:00")).toBeInTheDocument();
    expect(screen.getByText("8:30 present")).toBeInTheDocument();
    expect(screen.getByText("-0:30")).toBeInTheDocument();
  });

  it("leaves the balance out in MONTHLY mode", () => {
    render(<DayFigures day={day({ balanceMinutes: -30 })} mode="MONTHLY" today={null} />);

    expect(screen.queryByText("-0:30")).toBeNull();
    expect(screen.getByText("8:00")).toBeInTheDocument();
  });
});
