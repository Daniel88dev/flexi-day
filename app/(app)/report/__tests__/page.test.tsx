import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
vi.mock("@/components/report/team-usage-chart", () => ({
  TeamUsageChart: () => <div data-testid="usage-chart" />,
}));

vi.mock("@/components/report/team-remaining-chart", () => ({
  TeamRemainingChart: () => <div data-testid="remaining-chart" />,
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
    {
      userId: "u1",
      groupId: "g1",
      vacationType: VacationKind.HomeOffice,
      carriedOverDays: 0,
      yearQuota: 10,
      usedToDate: 0,
      plannedRemaining: 0,
      pending: 0,
      remaining: 10,
    },
  ],
};

/**
 * Last year's half of the rolling window. October falls inside it and March
 * does not, so a page that merged the whole year instead of the window would
 * show 9 rather than 4.
 */
const priorOverview: ReportOverview = {
  year: 2025,
  groups: scope.groups,
  members: scope.members,
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
};

const mocks = vi.hoisted(() => ({
  priorYear: 2025,
  scopeResult: { data: undefined as ReportScope | undefined, isPending: false },
  overviewResult: { data: undefined as ReportOverview | undefined, isPending: false },
  priorResult: { data: undefined as ReportOverview | undefined, isPending: false, isError: false },
}));

/**
 * Keyed by year, and deliberately indifferent to `enabled`: a disabled query
 * still hands back whatever the cache holds for its key, and a mock that
 * returns nothing when disabled cannot catch the page reading the prior-year
 * result it asked not to fetch.
 */
vi.mock("@/lib/api/queries", () => ({
  useReportScope: () => mocks.scopeResult,
  useReportOverview: (filters: { year: number }) =>
    filters.year === mocks.priorYear ? mocks.priorResult : mocks.overviewResult,
}));

const panelTriggers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]'));

describe("ReportPage", () => {
  // The default window is the twelve months ending today, so the fixtures only
  // line up against a pinned clock.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 7, 22));
    mocks.priorYear = 2025;
    mocks.scopeResult = { data: scope, isPending: false };
    mocks.overviewResult = { data: overview, isPending: false };
    mocks.priorResult = { data: priorOverview, isPending: false, isError: false };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a chart and a table row per member", () => {
    renderWithClient(<ReportPage />);

    expect(screen.getByRole("heading", { name: "Report", level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("usage-chart")).toBeInTheDocument();
    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
  });

  it("opens only the leading panel and leaves the rest collapsed", () => {
    const { container } = renderWithClient(<ReportPage />);

    const open = panelTriggers(container).filter(
      (trigger) => trigger.getAttribute("aria-expanded") === "true"
    );

    expect(open).toHaveLength(1);
    expect(open[0]?.textContent).toContain("Vacation · Monthly usage");
    expect(screen.getAllByTestId("usage-chart")).toHaveLength(1);
    expect(screen.queryByTestId("remaining-chart")).not.toBeInTheDocument();
  });

  it("lists usage before days-left for each leave type in turn", () => {
    const { container } = renderWithClient(<ReportPage />);

    expect(panelTriggers(container).map((trigger) => trigger.textContent)).toEqual([
      expect.stringContaining("Vacation · Monthly usage"),
      expect.stringContaining("Vacation · Days left"),
      expect.stringContaining("Home Office · Monthly usage"),
      expect.stringContaining("Home Office · Days left"),
    ]);
  });

  it("keeps monthly usage open when days-left is expanded", () => {
    renderWithClient(<ReportPage />);

    fireEvent.click(screen.getByRole("button", { name: /Vacation · Days left/ }));

    expect(screen.getByTestId("remaining-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("usage-chart")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Vacation · Monthly usage/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("merges last year's half of the rolling window and ignores months outside it", () => {
    const { container } = renderWithClient(<ReportPage />);

    const [usage] = panelTriggers(container);

    // 2 days in Mar 2026 plus 4 in Oct 2025. The 5 days in Mar 2025 sit before
    // the window opens and must not be counted.
    expect(usage?.textContent).toContain("Total: 6");
    expect(usage?.textContent).toContain("Sep 2025 – Aug 2026");
  });

  it("drops the prior year when a single calendar year is picked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderWithClient(<ReportPage />);

    await user.click(screen.getByRole("combobox", { name: "Period" }));
    await user.click(screen.getByRole("option", { name: "2026" }));

    const [usage] = panelTriggers(container);

    // Both query keys now resolve to 2026, so a page that read the prior-year
    // result unconditionally would count March twice and show 4.
    expect(usage?.textContent).toContain("Total: 2");
    expect(usage?.textContent).toContain("2026");
  });

  it("ignores a cached prior year the scope says holds no data", () => {
    mocks.scopeResult = { data: { ...scope, years: [2026] }, isPending: false };

    const { container } = renderWithClient(<ReportPage />);

    // The 2025 query is disabled, but a disabled query still returns its cached
    // payload — merging it would report 6.
    expect(panelTriggers(container)[0]?.textContent).toContain("Total: 2");
  });

  it("waits for both halves of the window before drawing anything", () => {
    mocks.priorResult = { data: undefined, isPending: true, isError: false };

    const { container } = renderWithClient(<ReportPage />);

    expect(panelTriggers(container)).toHaveLength(0);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("says so when last year could not be loaded", () => {
    mocks.priorResult = { data: undefined, isPending: false, isError: true };

    renderWithClient(<ReportPage />);

    expect(screen.getByRole("status")).toHaveTextContent(/Could not load 2025/);
  });

  it("offers the Excel export", () => {
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
