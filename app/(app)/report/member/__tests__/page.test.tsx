import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import MemberReportPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { MemberReport } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

const currentYear = 2026;
const priorYear = 2025;

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`userId=u1&year=${String(currentYear)}`),
  usePathname: () => "/report/member",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/report/member-quota-chart", () => ({
  MemberQuotaChart: ({ series }: { series: { year: number; month: number; used: number }[] }) => (
    <div
      data-testid="chart"
      data-window={series.map((point) => `${point.year}-${point.month}`).join(",")}
      data-used={series.reduce((total, point) => total + point.used, 0)}
    />
  ),
}));

const report: MemberReport = {
  year: currentYear,
  member: {
    id: "u1",
    name: "Ada Lovelace",
    initials: "AL",
    avatarColor: "hsl(200, 65%, 50%)",
  },
  groups: [{ groupId: "g1", groupName: "Engineering", access: "all", canEditQuotas: true }],
  quotas: [
    { userId: "u1", groupId: "g1", vacationDays: 20, homeOfficeDays: 10, carriedOverDays: 3 },
  ],
  summary: [
    {
      userId: "u1",
      groupId: "g1",
      vacationType: VacationKind.Vacation,
      carriedOverDays: 3,
      yearQuota: 20,
      usedToDate: 0,
      plannedRemaining: 0,
      pending: 0,
      remaining: 23,
    },
  ],
  monthly: [],
  bookings: [
    {
      userId: "u1",
      userName: "Ada Lovelace",
      groupId: "g1",
      groupName: "Engineering",
      vacationType: VacationKind.Vacation,
      from: "2026-03-12",
      to: "2026-03-14",
      days: 3,
      year: 2026,
      month: 3,
      status: "approved",
      note: null,
    },
  ],
  changes: [
    {
      id: "c1",
      groupId: "g1",
      changeType: "USER_YEAR_QUOTAS",
      changeDetail: "Quota for 2026: carried over 0 → 3",
      actor: {
        id: "admin",
        name: "Grace Hopper",
        initials: "GH",
        avatarColor: "hsl(10, 65%, 50%)",
      },
      createdAt: "2026-01-05T10:00:00.000Z",
    },
  ],
};

type QueryResult = { data?: MemberReport; isPending: boolean; isError: boolean; error?: Error };

const mocks = vi.hoisted(() => ({
  result: {} as QueryResult,
  prior: { isPending: false, isError: false } as QueryResult,
  scope: { data: { years: [2026, 2025] } as { years: number[] } | undefined, isPending: false },
}));

/**
 * Keyed by year and indifferent to `enabled`, mirroring a disabled query still
 * handing back its cached payload — a mock that returns nothing when disabled
 * cannot catch the page merging a year it asked not to fetch.
 */
vi.mock("@/lib/api/queries", () => ({
  useMemberReport: (_userId: string, year: number) => (year === 2025 ? mocks.prior : mocks.result),
  useReportScope: () => mocks.scope,
  useSetUserQuota: () => ({ mutate: vi.fn(), isPending: false }),
  useCarryOverSuggestion: () => ({ data: undefined }),
}));

const priorReport: MemberReport = {
  ...report,
  year: priorYear,
  monthly: [
    {
      userId: "u1",
      groupId: "g1",
      month: 10,
      vacationType: VacationKind.Vacation,
      used: 4,
      pending: 0,
    },
    {
      userId: "u1",
      groupId: "g1",
      month: 3,
      vacationType: VacationKind.Vacation,
      used: 5,
      pending: 0,
    },
  ],
  summary: [],
  bookings: [],
  changes: [],
};

describe("MemberReportPage", () => {
  // The trailing window is relative to "today", so the fixtures only line up
  // against a pinned clock.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 7, 22));
    mocks.result = { data: report, isPending: false, isError: false };
    mocks.prior = { data: priorReport, isPending: false, isError: false };
    mocks.scope = { data: { years: [2026, 2025] }, isPending: false };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the member's bookings", () => {
    renderWithClient(<MemberReportPage />);

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("2026-03-12 – 2026-03-14")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("merges last year's half of the rolling window into each chart", () => {
    renderWithClient(<MemberReportPage />);

    const chart = screen.getAllByTestId("chart")[0];

    // Sep 2025 through Aug 2026, so Oct 2025 counts and Mar 2025 does not.
    expect(chart?.getAttribute("data-window")).toBe(
      "2025-9,2025-10,2025-11,2025-12,2026-1,2026-2,2026-3,2026-4,2026-5,2026-6,2026-7,2026-8"
    );
    expect(chart?.getAttribute("data-used")).toBe("4");
  });

  it("ignores a cached prior year the scope says holds no data", () => {
    mocks.scope = { data: { years: [2026] }, isPending: false };

    renderWithClient(<MemberReportPage />);

    // The 2025 query is disabled, but still returns its cached payload.
    expect(screen.getAllByTestId("chart")[0]?.getAttribute("data-used")).toBe("0");
  });

  it("waits for the second year rather than drawing it as zeros", () => {
    mocks.prior = { data: undefined, isPending: true, isError: false };

    renderWithClient(<MemberReportPage />);

    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("says so when last year could not be loaded", () => {
    mocks.prior = { data: undefined, isPending: false, isError: true };

    renderWithClient(<MemberReportPage />);

    expect(screen.getByRole("status")).toHaveTextContent(/Could not load 2025/);
  });

  it("lists the admin changes with who made them", () => {
    renderWithClient(<MemberReportPage />);

    expect(screen.getByText("Quota for 2026: carried over 0 → 3")).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
  });

  it("offers the quota edit to an admin on the current year", () => {
    renderWithClient(<MemberReportPage />);

    expect(screen.getByRole("button", { name: "Edit quota" })).toBeInTheDocument();
  });

  it("hides the quota edit when the caller cannot administer the group", () => {
    mocks.result = {
      data: {
        ...report,
        groups: [{ groupId: "g1", groupName: "Engineering", access: "all", canEditQuotas: false }],
      },
      isPending: false,
      isError: false,
    };

    renderWithClient(<MemberReportPage />);

    expect(screen.queryByRole("button", { name: "Edit quota" })).not.toBeInTheDocument();
  });

  it("surfaces a permission error instead of an empty page", () => {
    mocks.result = {
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("No permission to view this member"),
    };

    renderWithClient(<MemberReportPage />);

    expect(screen.getByText("No permission to view this member")).toBeInTheDocument();
  });
});
