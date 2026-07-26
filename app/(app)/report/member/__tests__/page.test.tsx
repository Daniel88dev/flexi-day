import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import MemberReportPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { MemberReport } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

const currentYear = new Date().getFullYear();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`userId=u1&year=${String(currentYear)}`),
  usePathname: () => "/report/member",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/report/member-quota-chart", () => ({
  MemberQuotaChart: () => <div data-testid="chart" />,
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
  summary: [],
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

const mocks = vi.hoisted(() => ({
  result: {} as { data?: MemberReport; isPending: boolean; isError: boolean; error?: Error },
}));

vi.mock("@/lib/api/queries", () => ({
  useMemberReport: () => mocks.result,
  useSetUserQuota: () => ({ mutate: vi.fn(), isPending: false }),
  useCarryOverSuggestion: () => ({ data: undefined }),
}));

describe("MemberReportPage", () => {
  it("renders the member's bookings", () => {
    mocks.result = { data: report, isPending: false, isError: false };

    renderWithClient(<MemberReportPage />);

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("2026-03-12 – 2026-03-14")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("lists the admin changes with who made them", () => {
    mocks.result = { data: report, isPending: false, isError: false };

    renderWithClient(<MemberReportPage />);

    expect(screen.getByText("Quota for 2026: carried over 0 → 3")).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
  });

  it("offers the quota edit to an admin on the current year", () => {
    mocks.result = { data: report, isPending: false, isError: false };

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
