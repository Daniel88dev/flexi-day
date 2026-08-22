import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemberQuotaChart } from "@/components/report/member-quota-chart";
import { calendarMonths, trailingMonths, type MonthPoint } from "@/lib/report/series";

const series = (months: { year: number; month: number }[]): MonthPoint[] =>
  months.map((slot) => ({ ...slot, used: 0, pending: 0 }));

// Recharts measures its container, which jsdom reports as 0x0, so nothing is
// drawn here — the guide-line rule itself is covered on `monthlyTargetFor`.
describe("MemberQuotaChart", () => {
  it("renders for a single calendar year", () => {
    const { container } = render(
      <MemberQuotaChart series={series(calendarMonths(2026))} quota={24} />
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("renders for a window that crosses New Year", () => {
    const { container } = render(
      <MemberQuotaChart series={series(trailingMonths(new Date(2026, 7, 22)))} quota={24} />
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("renders with no series rather than crashing", () => {
    const { container } = render(<MemberQuotaChart series={[]} quota={0} />);

    expect(container).toBeInTheDocument();
  });
});
