import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getReportOverview: vi.fn(),
  getMemberReport: vi.fn(),
}));
vi.mock("../reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../reports")>()),
  getReportOverview: api.getReportOverview,
  getMemberReport: api.getMemberReport,
}));

import { memberReportQuery, reportOverviewQuery } from "../queries";

const call = (queryFn: unknown) => (queryFn as () => unknown)();

describe("reportOverviewQuery", () => {
  it("keys each year apart and fetches that year's overview", () => {
    const filters = { year: 2025, groupIds: ["g1"] };
    const options = reportOverviewQuery(filters);

    expect(options.queryKey).toEqual(["report-overview", "year=2025&groupIds=g1"]);
    expect(reportOverviewQuery({ ...filters, year: 2026 }).queryKey).not.toEqual(options.queryKey);

    call(options.queryFn);
    expect(api.getReportOverview).toHaveBeenCalledWith(filters);
  });
});

describe("memberReportQuery", () => {
  it("keys on the member and the year and fetches that report", () => {
    const options = memberReportQuery("u1", 2025);

    expect(options.queryKey).toEqual(["member-report", "u1", 2025]);
    expect(options.enabled).toBe(true);

    call(options.queryFn);
    expect(api.getMemberReport).toHaveBeenCalledWith("u1", 2025);
  });

  it("stays disabled without a member to fetch", () => {
    expect(memberReportQuery("", 2025).enabled).toBe(false);
    expect(memberReportQuery(null, 2025).enabled).toBe(false);
  });
});
