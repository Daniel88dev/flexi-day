import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import ReportPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { ReportOverview, ReportScope } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/report",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

// Recharts measures its container, which jsdom reports as 0x0 — stub the chart
// so the page's own structure is what the test exercises.
vi.mock("@/components/report/member-quota-chart", () => ({
  MemberQuotaChart: () => <div data-testid="chart" />,
}));

const scope: ReportScope = {
  groups: [{ groupId: "g1", groupName: "Engineering", access: "all", canEditQuotas: true }],
  members: [
    {
      id: "u1",
      name: "Ada Lovelace",
      initials: "AL",
      avatarColor: "hsl(200, 65%, 50%)",
      groupId: "g1",
    },
  ],
  years: [2026, 2025],
};

const overview: ReportOverview = {
  year: 2026,
  groups: scope.groups,
  members: scope.members,
  monthly: [
    {
      userId: "u1",
      groupId: "g1",
      month: 3,
      vacationType: VacationKind.Vacation,
      used: 2,
      pending: 0,
    },
  ],
  summary: [
    {
      userId: "u1",
      groupId: "g1",
      vacationType: VacationKind.Vacation,
      carriedOverDays: 3,
      yearQuota: 20,
      usedToDate: 2,
      plannedRemaining: 0,
      pending: 0,
      remaining: 21,
    },
  ],
};

const mocks = vi.hoisted(() => ({
  scopeResult: { data: undefined as ReportScope | undefined, isPending: false },
  overviewResult: { data: undefined as ReportOverview | undefined, isPending: false },
}));

vi.mock("@/lib/api/queries", () => ({
  useReportScope: () => mocks.scopeResult,
  useReportOverview: () => mocks.overviewResult,
}));

describe("ReportPage", () => {
  it("renders a chart and a table row per member", () => {
    mocks.scopeResult = { data: scope, isPending: false };
    mocks.overviewResult = { data: overview, isPending: false };

    renderWithClient(<ReportPage />);

    expect(screen.getByRole("heading", { name: "Report", level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
  });

  it("offers the Excel export", () => {
    mocks.scopeResult = { data: scope, isPending: false };
    mocks.overviewResult = { data: overview, isPending: false };

    renderWithClient(<ReportPage />);

    expect(screen.getByRole("button", { name: /Export to Excel/i })).toBeInTheDocument();
  });

  it("explains itself to a user who belongs to no group", () => {
    mocks.scopeResult = {
      data: { groups: [], members: [], years: [2026] },
      isPending: false,
    };
    mocks.overviewResult = {
      data: { ...overview, members: [], monthly: [], summary: [] },
      isPending: false,
    };

    renderWithClient(<ReportPage />);

    expect(screen.getByText(/Nothing to report yet/i)).toBeInTheDocument();
  });

  it("shows the loading state while the overview is in flight", () => {
    mocks.scopeResult = { data: scope, isPending: false };
    mocks.overviewResult = { data: undefined, isPending: true };

    renderWithClient(<ReportPage />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
