import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import MemberReportPage from "../page";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { MemberReport } from "@/lib/api/report-types";
import { CalendarRecordType } from "@/lib/api/types";

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

const dialog = vi.hoisted(() => ({ quota: "unset" as unknown }));

vi.mock("@/components/report/quota-edit-dialog", () => ({
  QuotaEditDialog: ({ quota }: { quota: unknown }) => {
    dialog.quota = quota;
    return <div role="dialog" />;
  },
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
      vacationType: CalendarRecordType.Vacation,
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
      vacationType: CalendarRecordType.Vacation,
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
  fetchYear: (() => Promise.resolve(undefined)) as (year: number) => Promise<unknown>,
  scope: {
    data: { years: [2026, 2025] } as { years: number[] } | undefined,
    isPending: false,
    isError: false,
  },
}));

vi.mock("@/lib/api/queries", () => ({
  useMemberReport: () => mocks.result,
  memberReportQuery: (_userId: string, year: number) => ({
    queryKey: ["member-report", year],
    queryFn: () => mocks.fetchYear(year),
  }),
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
  bookings: [],
  changes: [],
};

/**
 * Seeds the cache per year, which hands the window its second year
 * synchronously. A disabled query still returns what the cache holds, so
 * seeding a year the page should not read is how that guard is caught.
 */
function renderPage(
  ui: ReactElement = <MemberReportPage />,
  cached: Record<number, MemberReport> = { [priorYear]: priorReport }
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const [year, data] of Object.entries(cached)) {
    client.setQueryData(["member-report", Number(year)], data);
  }
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("MemberReportPage", () => {
  // The trailing window is relative to "today", so the fixtures only line up
  // against a pinned clock.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 7, 22));
    mocks.result = { data: report, isPending: false, isError: false };
    mocks.fetchYear = (year) => Promise.resolve(year === priorYear ? priorReport : report);
    mocks.scope = { data: { years: [2026, 2025] }, isPending: false, isError: false };
    dialog.quota = "unset";
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("leaves out the Note column when no booking carries a note, as for a teammate", () => {
    renderPage();

    expect(screen.getByText("2026-03-12 – 2026-03-14")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Note" })).not.toBeInTheDocument();
  });

  it("keeps the Note column when a booking carries a note", () => {
    mocks.result = {
      data: { ...report, bookings: report.bookings.map((b) => ({ ...b, note: "Family trip" })) },
      isPending: false,
      isError: false,
    };
    renderPage();

    expect(screen.getByRole("columnheader", { name: "Note" })).toBeInTheDocument();
    expect(screen.getByText("Family trip")).toBeInTheDocument();
  });

  it("renders the member's bookings", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("2026-03-12 – 2026-03-14")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders the booking's type from the dictionary when Czech is active", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");

    renderPage(
      <I18nProvider>
        <MemberReportPage />
      </I18nProvider>
    );

    const row = screen.getByText("2026-03-12 – 2026-03-14").closest("tr");
    await waitFor(() => expect(row).toHaveTextContent("Dovolená"));
  });

  it("merges last year's half of the rolling window into each chart", () => {
    renderPage();

    const chart = screen.getAllByTestId("chart")[0];

    // Sep 2025 through Aug 2026, so Oct 2025 counts and Mar 2025 does not.
    expect(chart?.getAttribute("data-window")).toBe(
      "2025-9,2025-10,2025-11,2025-12,2026-1,2026-2,2026-3,2026-4,2026-5,2026-6,2026-7,2026-8"
    );
    expect(chart?.getAttribute("data-used")).toBe("4");
  });

  it("ignores a cached prior year the scope says holds no data", () => {
    mocks.scope = { data: { years: [2026] }, isPending: false, isError: false };

    renderPage();

    // The 2025 query is disabled, but still returns its cached payload.
    expect(screen.getAllByTestId("chart")[0]?.getAttribute("data-used")).toBe("0");
  });

  it("waits for the second year rather than drawing it as zeros", () => {
    mocks.fetchYear = () => new Promise(() => {});

    renderPage(<MemberReportPage />, {});

    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("says so when last year could not be loaded", async () => {
    mocks.fetchYear = () => Promise.reject(new Error("boom"));

    renderPage(<MemberReportPage />, {});

    expect(await screen.findByRole("status")).toHaveTextContent(/Could not load 2025/);
  });

  it("keeps both halves and no notice when a scope refetch fails over a cached scope", () => {
    mocks.scope = { data: { years: [2026, 2025] }, isPending: false, isError: true };

    renderPage();

    expect(screen.getAllByTestId("chart")[0]?.getAttribute("data-used")).toBe("4");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("says so when the scope never loaded and last year is unknown", () => {
    mocks.scope = { data: undefined, isPending: false, isError: true };

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(/Could not load 2025/);
  });

  it("lists the admin changes with who made them", () => {
    renderPage();

    expect(screen.getByText("Quota for 2026: carried over 0 → 3")).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
  });

  it("tells a change by a deleted user apart from the year rollover", () => {
    mocks.result = {
      data: {
        ...report,
        changes: [
          {
            id: "c-deleted",
            groupId: "g1",
            changeType: "USER_YEAR_QUOTAS",
            changeDetail: "Quota for 2026: vacation 20 → 25",
            actor: null,
            actorDeleted: true,
            createdAt: "2026-02-01T10:00:00.000Z",
          },
          {
            id: "c-rollover",
            groupId: "g1",
            changeType: "USER_YEAR_QUOTAS",
            changeDetail: "Quota for 2026: carried over 0 → 3",
            actor: null,
            actorDeleted: false,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      isPending: false,
      isError: false,
    };

    renderPage();

    const deleted = screen.getByText("Quota for 2026: vacation 20 → 25").closest("li");
    const rollover = screen.getByText("Quota for 2026: carried over 0 → 3").closest("li");
    expect(deleted).toHaveTextContent("by a deleted user");
    expect(rollover).toHaveTextContent("automatically at the turn of the year");
    expect(rollover).not.toHaveTextContent("deleted");
  });

  it("offers the quota edit to an admin on the current year", () => {
    renderPage();

    expect(screen.getByRole("button", { name: "Edit quota" })).toBeInTheDocument();
  });

  it("shows the group defaults for a member with no quota row", () => {
    mocks.result = {
      data: {
        ...report,
        quotas: [],
        summary: [
          {
            userId: "u1",
            groupId: "g1",
            vacationType: CalendarRecordType.Vacation,
            carriedOverDays: 0,
            yearQuota: 20,
            usedToDate: 0,
            plannedRemaining: 0,
            pending: 0,
            remaining: 20,
          },
          {
            userId: "u1",
            groupId: "g1",
            vacationType: CalendarRecordType.HomeOffice,
            carriedOverDays: 0,
            yearQuota: 12,
            usedToDate: 0,
            plannedRemaining: 0,
            pending: 0,
            remaining: 12,
          },
        ],
      },
      isPending: false,
      isError: false,
    };

    renderPage();

    const figure = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
    expect(figure("Carried over")).toBe("0");
    expect(figure("Year quota")).toBe("20");
    expect(figure("Home office days")).toBe("12");

    fireEvent.click(screen.getByRole("button", { name: "Edit quota" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(dialog.quota).toBeUndefined();
  });

  it("hands the stored quota row to the edit dialog", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit quota" }));
    expect(dialog.quota).toEqual(report.quotas[0]);
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

    renderPage();

    expect(screen.queryByRole("button", { name: "Edit quota" })).not.toBeInTheDocument();
  });

  it("surfaces a permission error instead of an empty page", () => {
    mocks.result = {
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("No permission to view this member"),
    };

    renderPage();

    expect(screen.getByText("No permission to view this member")).toBeInTheDocument();
  });
});
