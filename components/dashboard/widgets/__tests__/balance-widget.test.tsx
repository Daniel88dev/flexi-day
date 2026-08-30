import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { BalanceWidget } from "../balance-widget";
import { renderWithClient } from "@/lib/test-utils";
import { CalendarRecordType, type BalanceSummary } from "@/lib/api/types";

const summary: BalanceSummary = {
  year: "2026",
  buckets: [
    { type: CalendarRecordType.Vacation, allocated: 25, used: 9, pending: 2 },
    { type: CalendarRecordType.HomeOffice, allocated: 60, used: 12, pending: 0 },
    { type: CalendarRecordType.Sick, allocated: 0, used: 1, pending: 0 },
    { type: CalendarRecordType.SickDay, allocated: 5, used: 2, pending: 0 },
  ],
};

vi.mock("@/lib/api/queries", () => ({
  useMyBalances: () => ({ data: summary, isLoading: false, error: null }),
}));

describe("BalanceWidget", () => {
  it("renders allocated buckets only and shows leftover counts", () => {
    renderWithClient(<BalanceWidget year={2026} />);
    expect(screen.getByText("My balance")).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
    expect(screen.getByText("Home Office")).toBeInTheDocument();
    expect(screen.queryByText("Sick")).not.toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument(); // 25 - 9 left
  });

  it("renders a sick day bucket like any other allocated type", () => {
    renderWithClient(<BalanceWidget year={2026} />);
    expect(screen.getByText("Sick day")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // 5 - 2 left
  });
});
