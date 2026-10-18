import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import ReportPage from "../page";
import type { ReportOverview, ReportScope } from "@/lib/api/report-types";
import { CalendarRecordType } from "@/lib/api/types";

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
      vacationType: CalendarRecordType.Vacation,
      used: 2,
      pending: 0,
    },
  ],
  summary: [
    {
      userId: "u1",
      groupId: "g1",
      vacationType: CalendarRecordType.Vacation,
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
      vacationType: CalendarRecordType.HomeOffice,
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
      vacationType: CalendarRecordType.Vacation,
      used: 4,
      pending: 0,
    },
    {
      userId: "u1",
      groupId: "g1",
      month: 3,
      vacationType: CalendarRecordType.Vacation,
      used: 5,
      pending: 0,
    },
  ],
  summary: [],
};

const mocks = vi.hoisted(() => ({
  scopeResult: {
    data: undefined as ReportScope | undefined,
    isPending: false,
    isError: false,
  },
  overviewResult: { data: undefined as ReportOverview | undefined, isPending: false },
  fetchYear: (() => Promise.resolve(undefined)) as (year: number) => Promise<unknown>,
}));

// Last year goes through a real query. Keying the mock by year alone makes a
// single calendar year resolve to the cache entry the test seeds for it.
vi.mock("@/lib/api/queries", () => ({
  useReportScope: () => mocks.scopeResult,
  useReportOverview: () => mocks.overviewResult,
  reportOverviewQuery: (filters: { year: number }) => ({
    queryKey: ["report-overview", filters.year],
    queryFn: () => mocks.fetchYear(filters.year),
  }),
}));

/**
 * Seeds the cache per year, which is how a test hands the window its second
 * year synchronously. A disabled query still returns what the cache holds, so
 * seeding a year the page should not read is how that guard is caught.
 */
function renderPage(cached: Record<number, ReportOverview> = { 2025: priorOverview }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const [year, data] of Object.entries(cached)) {
    client.setQueryData(["report-overview", Number(year)], data);
  }
  return render(
    <QueryClientProvider client={client}>
      <ReportPage />
    </QueryClientProvider>
  );
}

const panelTriggers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]'));

describe("ReportPage", () => {
  // The default window is the twelve months ending today, so the fixtures only
  // line up against a pinned clock.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 7, 22));
    mocks.scopeResult = { data: scope, isPending: false, isError: false };
    mocks.overviewResult = { data: overview, isPending: false };
    mocks.fetchYear = (year) => Promise.resolve(year === 2025 ? priorOverview : overview);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a chart and a table row per member", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Report", level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("usage-chart")).toBeInTheDocument();
    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
  });

  it("opens only the leading panel and leaves the rest collapsed", () => {
    const { container } = renderPage();

    const open = panelTriggers(container).filter(
      (trigger) => trigger.getAttribute("aria-expanded") === "true"
    );

    expect(open).toHaveLength(1);
    expect(open[0]?.textContent).toContain("Vacation · Monthly usage");
    expect(screen.getAllByTestId("usage-chart")).toHaveLength(1);
    expect(screen.queryByTestId("remaining-chart")).not.toBeInTheDocument();
  });

  it("lists usage before days-left for each leave type in turn", () => {
    const { container } = renderPage();

    expect(panelTriggers(container).map((trigger) => trigger.textContent)).toEqual([
      expect.stringContaining("Vacation · Monthly usage"),
      expect.stringContaining("Vacation · Days left"),
      expect.stringContaining("Home Office · Monthly usage"),
      expect.stringContaining("Home Office · Days left"),
    ]);
  });

  it("keeps monthly usage open when days-left is expanded", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Vacation · Days left/ }));

    expect(screen.getByTestId("remaining-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("usage-chart")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Vacation · Monthly usage/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("merges last year's half of the rolling window and ignores months outside it", () => {
    const { container } = renderPage();

    const [usage] = panelTriggers(container);

    // 2 days in Mar 2026 plus 4 in Oct 2025. The 5 days in Mar 2025 sit before
    // the window opens and must not be counted.
    expect(usage?.textContent).toContain("Total: 6");
    expect(usage?.textContent).toContain("Sep 2025 – Aug 2026");
  });

  it("drops the prior year when a single calendar year is picked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderPage({ 2025: priorOverview, 2026: overview });

    await user.click(screen.getByRole("combobox", { name: "Period" }));
    await user.click(screen.getByRole("option", { name: "2026" }));

    const [usage] = panelTriggers(container);

    // Both query keys now resolve to 2026, so a page that read the prior-year
    // result unconditionally would count March twice and show 4.
    expect(usage?.textContent).toContain("Total: 2");
    expect(usage?.textContent).toContain("2026");
  });

  it("ignores a cached prior year the scope says holds no data", () => {
    mocks.scopeResult = { data: { ...scope, years: [2026] }, isPending: false, isError: false };

    const { container } = renderPage();

    // The 2025 query is disabled, but a disabled query still returns its cached
    // payload — merging it would report 6.
    expect(panelTriggers(container)[0]?.textContent).toContain("Total: 2");
  });

  it("waits for both halves of the window before drawing anything", () => {
    mocks.fetchYear = () => new Promise(() => {});

    const { container } = renderPage({});

    expect(panelTriggers(container)).toHaveLength(0);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("says so when last year could not be loaded", async () => {
    mocks.fetchYear = () => Promise.reject(new Error("boom"));

    renderPage({});

    expect(await screen.findByRole("status")).toHaveTextContent(/Could not load 2025/);
  });

  it("still draws both halves when a scope refetch fails over a cached scope", () => {
    mocks.scopeResult = { data: scope, isPending: false, isError: true };

    const { container } = renderPage();

    expect(panelTriggers(container)[0]?.textContent).toContain("Total: 6");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("offers the Excel export", () => {
    renderPage();

    expect(screen.getByRole("button", { name: /Export to Excel/i })).toBeInTheDocument();
  });

  it("explains itself to a user who belongs to no group", () => {
    mocks.scopeResult = {
      data: { groups: [], members: [], years: [2026] },
      isPending: false,
      isError: false,
    };
    mocks.overviewResult = {
      data: { ...overview, members: [], monthly: [], summary: [] },
      isPending: false,
    };

    renderPage();

    expect(screen.getByText(/Nothing to report yet/i)).toBeInTheDocument();
  });

  it("says the report could not load when the scope query fails", () => {
    mocks.scopeResult = { data: undefined, isPending: false, isError: true };

    const { container } = renderPage();

    expect(screen.getByText(/Could not load the report/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nothing to report yet/i)).not.toBeInTheDocument();
    expect(panelTriggers(container)).toHaveLength(0);
  });

  it("does not call the report empty while the scope is still loading", () => {
    mocks.scopeResult = { data: undefined, isPending: true, isError: false };

    renderPage();

    expect(screen.queryByText(/Nothing to report yet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows the loading state while the overview is in flight", () => {
    mocks.scopeResult = { data: scope, isPending: false, isError: false };
    mocks.overviewResult = { data: undefined, isPending: true };

    renderPage();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
