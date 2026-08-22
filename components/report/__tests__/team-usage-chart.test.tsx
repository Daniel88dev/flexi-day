import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TeamUsageChart } from "@/components/report/team-usage-chart";
import { buildTeamMonthlySeries, calendarMonths } from "@/lib/report/series";
import type { ReportScopeMember } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

const members: ReportScopeMember[] = [
  { id: "u1", name: "Ada", initials: "AD", avatarColor: "hsl(200, 65%, 50%)", groupId: "g1" },
  { id: "u2", name: "Bob", initials: "BO", avatarColor: "hsl(30, 70%, 55%)", groupId: "g1" },
];

const colors = { u1: "hsl(200, 65%, 50%)", u2: "hsl(30, 70%, 55%)" };

const series = buildTeamMonthlySeries(
  [
    {
      userId: "u1",
      groupId: "g1",
      year: 2026,
      month: 3,
      vacationType: VacationKind.Vacation,
      used: 2,
      pending: 1,
    },
  ],
  ["u1", "u2"],
  VacationKind.Vacation,
  calendarMonths(2026)
);

describe("TeamUsageChart", () => {
  it("renders a legend chip per member and the layer toggles", () => {
    render(<TeamUsageChart members={members} series={series} colors={colors} />);

    expect(screen.getByRole("button", { name: "Show or hide Ada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show or hide Bob" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bars" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Lines" })).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles a member off and back on via their legend chip", () => {
    render(<TeamUsageChart members={members} series={series} colors={colors} />);

    const chip = screen.getByRole("button", { name: "Show or hide Ada" });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles the bar and line layers", () => {
    render(<TeamUsageChart members={members} series={series} colors={colors} />);

    const bars = screen.getByRole("button", { name: "Bars" });
    fireEvent.click(bars);
    expect(bars).toHaveAttribute("aria-pressed", "false");

    const lines = screen.getByRole("button", { name: "Lines" });
    fireEvent.click(lines);
    expect(lines).toHaveAttribute("aria-pressed", "false");
  });
});
