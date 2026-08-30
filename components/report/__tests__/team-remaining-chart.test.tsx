import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamRemainingChart } from "@/components/report/team-remaining-chart";
import { buildMemberRemaining } from "@/lib/report/series";
import type { ReportScopeMember, ReportSummaryRow } from "@/lib/api/report-types";
import { CalendarRecordType } from "@/lib/api/types";

const members: ReportScopeMember[] = [
  { id: "u1", name: "Ada", initials: "AD", avatarColor: "hsl(200, 65%, 50%)", groupId: "g1" },
  { id: "u2", name: "Bob", initials: "BO", avatarColor: "hsl(30, 70%, 55%)", groupId: "g1" },
];

const row = (over: Partial<ReportSummaryRow>): ReportSummaryRow => ({
  userId: "u1",
  groupId: "g1",
  vacationType: CalendarRecordType.Vacation,
  carriedOverDays: 3,
  yearQuota: 20,
  usedToDate: 2,
  plannedRemaining: 0,
  pending: 0,
  remaining: 21,
  ...over,
});

const build = (summary: ReportSummaryRow[]) =>
  buildMemberRemaining(members, summary, CalendarRecordType.Vacation);

describe("TeamRemainingChart", () => {
  it("labels both stacked sections in the legend", () => {
    const remaining = build([row({}), row({ userId: "u2" })]);

    render(<TeamRemainingChart remaining={remaining} year={2026} color="var(--c-vacation)" />);

    expect(screen.getByText("Left from last year")).toBeInTheDocument();
    expect(screen.getByText("Left from 2026")).toBeInTheDocument();
  });

  it("hides the overdraft key until someone is actually overdrawn", () => {
    const remaining = build([row({}), row({ userId: "u2" })]);

    render(<TeamRemainingChart remaining={remaining} year={2026} color="var(--c-vacation)" />);

    expect(screen.queryByText("Over allowance")).not.toBeInTheDocument();
  });

  it("shows the overdraft key once a member is over their allowance", () => {
    const remaining = build([row({ usedToDate: 26 }), row({ userId: "u2" })]);

    render(<TeamRemainingChart remaining={remaining} year={2026} color="var(--c-vacation)" />);

    expect(screen.getByText("Over allowance")).toBeInTheDocument();
  });

  it("hides the carry-over key for a type that cannot carry over", () => {
    // The backend zeroes carriedOverDays for everything but vacation, so that
    // half of the stack can never be drawn here.
    const homeOffice = buildMemberRemaining(
      members,
      [
        row({ vacationType: CalendarRecordType.HomeOffice, carriedOverDays: 0, yearQuota: 10 }),
        row({
          userId: "u2",
          vacationType: CalendarRecordType.HomeOffice,
          carriedOverDays: 0,
          yearQuota: 10,
        }),
      ],
      CalendarRecordType.HomeOffice
    );

    render(<TeamRemainingChart remaining={homeOffice} year={2026} color="var(--c-home)" />);

    expect(screen.getByText("Left from 2026")).toBeInTheDocument();
    expect(screen.queryByText("Left from last year")).not.toBeInTheDocument();
  });

  it("still charts an overdrawn member who has no quota row at all", () => {
    // Booking against a group default is supported, so a zero allowance with
    // leave taken means overdrawn, not "nothing set up".
    const overdrawn = buildMemberRemaining(
      members,
      [row({ carriedOverDays: 0, yearQuota: 0, usedToDate: 5 })],
      CalendarRecordType.Vacation
    );

    render(<TeamRemainingChart remaining={overdrawn} year={2026} color="var(--c-vacation)" />);

    expect(screen.queryByText("No allowance set for these filters.")).not.toBeInTheDocument();
    expect(screen.getByText("Over allowance")).toBeInTheDocument();
  });

  it("says so when nobody has an allowance instead of drawing an empty axis", () => {
    render(
      <TeamRemainingChart
        remaining={buildMemberRemaining(members, [], CalendarRecordType.Sick)}
        year={2026}
        color="var(--c-sick)"
      />
    );

    expect(screen.getByText("No allowance set for these filters.")).toBeInTheDocument();
  });

  it("renders without members rather than crashing", () => {
    const { container } = render(
      <TeamRemainingChart remaining={[]} year={2026} color="var(--c-vacation)" />
    );

    expect(container).toBeInTheDocument();
  });
});
