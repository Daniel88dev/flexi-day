import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LeaveCalendar, type CalendarRange } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";
import { isoDate } from "@/lib/calendar/month-grid";

const baseProps = { year: 2026, month: 7 } as const;
function danaBar(overrides: Partial<CalendarRange>): CalendarRange {
  return {
    id: "r0",
    who: "u1",
    user: { id: "u1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
    type: CalendarRecordType.Vacation,
    from: isoDate(2026, 7, 8),
    to: isoDate(2026, 7, 8),
    vacationIds: ["v-8"],
    ...overrides,
  };
}

describe("LeaveCalendar bar look", () => {
  it("draws a pending bar with a dashed outline all round, a fainter fill and no solid left edge", () => {
    render(
      <LeaveCalendar
        {...baseProps}
        ranges={[
          danaBar({ id: "approved", from: isoDate(2026, 7, 8), to: isoDate(2026, 7, 8) }),
          danaBar({
            id: "pending",
            from: isoDate(2026, 7, 15),
            to: isoDate(2026, 7, 15),
            pending: true,
          }),
        ]}
      />
    );

    const approved = screen.getByTitle("Dana Holt · Vacation");
    const pending = screen.getByTitle("Dana Holt · Vacation · Pending");

    expect(approved.style.borderLeft).toBe("3px solid var(--c-vacation)");
    expect(approved.style.borderTop).toBe("");
    expect(approved.style.background).toContain("16%");

    expect(pending.style.border).toBe("1px dashed var(--c-vacation)");
    expect(pending.getAttribute("style")).not.toContain("solid");
    expect(pending.style.background).toContain("8%");
  });

  it("gives a mirrored pending bar the dashed outline and keeps its arrow and source", () => {
    render(
      <LeaveCalendar {...baseProps} ranges={[danaBar({ pending: true, mirroredFrom: "Team B" })]} />
    );

    const bar = screen.getByTitle("Dana Holt · Vacation · Pending · mirrored from Team B");
    expect(bar.style.border).toBe("1px dashed var(--c-vacation)");
    expect(bar.getAttribute("style")).not.toContain("3px");
    expect(bar).toHaveTextContent("Dana ↗");
  });

  it("names the pending state in the bar's accessible label", () => {
    render(
      <LeaveCalendar {...baseProps} ranges={[danaBar({ pending: true })]} onSelect={() => {}} />
    );

    expect(
      screen.getByRole("button", {
        name: "Open request details: Dana Holt · Vacation · Pending",
      })
    ).toBeInTheDocument();
  });

  it("marks a half-day bar with ½ after the name", () => {
    render(<LeaveCalendar {...baseProps} ranges={[danaBar({ halfDay: true })]} />);

    expect(within(screen.getByTitle("Dana Holt · Vacation")).getByText("Dana ½")).toBeVisible();
  });

  it("marks a half-day bar with ½ in the mini calendar too", () => {
    render(<LeaveCalendar {...baseProps} ranges={[danaBar({ halfDay: true })]} mini />);

    expect(within(screen.getByTitle("Dana Holt · Vacation")).getByText("Dana ½")).toBeVisible();
  });

  it("places a bar by its dates and splits it where it crosses into the next week", () => {
    // 3 July 2026 is a Friday, so the bar runs Friday to Sunday, then Monday to Tuesday.
    render(
      <LeaveCalendar
        {...baseProps}
        ranges={[danaBar({ from: isoDate(2026, 7, 3), to: isoDate(2026, 7, 7) })]}
      />
    );

    const pieces = screen.getAllByTitle("Dana Holt · Vacation");
    expect(pieces.map((p) => p.parentElement?.style.gridColumn)).toEqual(["5 / 8", "1 / 3"]);
  });

  it("leaves a full-day bar's name bare", () => {
    render(<LeaveCalendar {...baseProps} ranges={[danaBar({})]} />);

    expect(within(screen.getByTitle("Dana Holt · Vacation")).getByText("Dana")).toBeVisible();
  });
});
