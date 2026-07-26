import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", async () => {
  const actual = await vi.importActual<typeof import("../client")>("../client");
  return { ...actual, api: (...args: unknown[]) => apiMock(...args) };
});

import {
  exportReport,
  filenameFromDisposition,
  getMemberReport,
  getReportOverview,
  getReportScope,
  reportFiltersToQuery,
} from "../reports";
import { ApiError } from "../client";
import { VacationKind } from "../types";

describe("reportFiltersToQuery", () => {
  it("always sends the year", () => {
    expect(reportFiltersToQuery({ year: 2026 })).toBe("year=2026");
  });

  it("joins each filter list with commas", () => {
    const query = reportFiltersToQuery({
      year: 2026,
      groupIds: ["g1", "g2"],
      userIds: ["u1"],
      types: [VacationKind.Vacation, VacationKind.Sick],
    });

    expect(decodeURIComponent(query)).toBe(
      "year=2026&groupIds=g1,g2&userIds=u1&types=VACATION,SICK"
    );
  });

  it("omits empty filter lists rather than sending blanks", () => {
    expect(reportFiltersToQuery({ year: 2026, groupIds: [], userIds: [], types: [] })).toBe(
      "year=2026"
    );
  });
});

describe("reports api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("getReportScope GETs the scope endpoint", async () => {
    await getReportScope();
    expect(apiMock).toHaveBeenCalledWith("/api/reports/scope");
  });

  it("getReportOverview appends the serialised filters", async () => {
    await getReportOverview({ year: 2026, groupIds: ["g1"] });
    expect(apiMock).toHaveBeenCalledWith("/api/reports/overview?year=2026&groupIds=g1");
  });

  it("getMemberReport encodes the member into the path with the year", async () => {
    await getMemberReport("u-1", 2026);
    expect(apiMock).toHaveBeenCalledWith("/api/reports/members/u-1?year=2026");
  });
});

describe("filenameFromDisposition", () => {
  it("falls back when the header is absent", () => {
    expect(filenameFromDisposition(null, "fallback.xlsx")).toBe("fallback.xlsx");
  });

  it("reads a quoted filename", () => {
    expect(
      filenameFromDisposition('attachment; filename="flexi-day-report-2026.xlsx"', "fallback.xlsx")
    ).toBe("flexi-day-report-2026.xlsx");
  });

  it("decodes a percent-encoded filename", () => {
    expect(filenameFromDisposition("attachment; filename=my%20report.xlsx", "f.xlsx")).toBe(
      "my report.xlsx"
    );
  });

  it("falls back when the header carries no filename", () => {
    expect(filenameFromDisposition("attachment", "fallback.xlsx")).toBe("fallback.xlsx");
  });
});

describe("exportReport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs the filters and returns the blob with its filename", async () => {
    const blob = new Blob(["x"]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
      headers: new Headers({ "Content-Disposition": 'attachment; filename="report.xlsx"' }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await exportReport({ year: 2026 });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
    expect(result).toEqual({ blob, filename: "report.xlsx" });
  });

  it("names the file after the year when the server sends no disposition", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(["x"])),
        headers: new Headers(),
      })
    );

    await expect(exportReport({ year: 2026 })).resolves.toMatchObject({
      filename: "flexi-day-report-2026.xlsx",
    });
  });

  it("throws an ApiError carrying the status when the export is refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        statusText: "Payload Too Large",
        text: () => Promise.resolve(JSON.stringify({ errors: [{ message: "Export too large" }] })),
        headers: new Headers(),
      })
    );

    await expect(exportReport({ year: 2026 })).rejects.toMatchObject({
      status: 413,
      message: "Export too large",
    });
    await expect(exportReport({ year: 2026 })).rejects.toBeInstanceOf(ApiError);
  });

  it("uses the raw body as the message when the error is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: () => Promise.resolve("boom"),
        headers: new Headers(),
      })
    );

    await expect(exportReport({ year: 2026 })).rejects.toMatchObject({ message: "boom" });
  });
});
