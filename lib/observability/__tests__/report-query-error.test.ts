import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import * as Sentry from "@sentry/nextjs";
import { ApiError } from "@/lib/api/client";
import { reportQueryError, shouldReport } from "@/lib/observability/report-query-error";

describe("shouldReport", () => {
  it.each([401, 403, 404, 409, 422])("drops the expected status %i", (status) => {
    expect(shouldReport(new ApiError(status, "nope"))).toBe(false);
  });

  it.each([500, 502, 400, 418])("reports the unexpected status %i", (status) => {
    expect(shouldReport(new ApiError(status, "boom"))).toBe(true);
  });

  it("reports a plain network failure", () => {
    expect(shouldReport(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("drops an aborted request", () => {
    const aborted = new Error("aborted");
    aborted.name = "AbortError";
    expect(shouldReport(aborted)).toBe(false);
  });

  it("ignores non-Error rejections", () => {
    expect(shouldReport("just a string")).toBe(false);
  });
});

describe("reportQueryError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("raises no issue for an expected status, but still logs it", () => {
    reportQueryError(new ApiError(401, "Unauthorized"), "query", ["vacations"]);

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("handled"),
      expect.objectContaining({ "http.response.status_code": 401, "query.resource": "vacations" })
    );
  });

  it("logs an aborted request nowhere at all", () => {
    const aborted = new Error("aborted");
    aborted.name = "AbortError";

    reportQueryError(aborted, "query", ["vacations"]);

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.logger.warn).not.toHaveBeenCalled();
    expect(Sentry.logger.error).not.toHaveBeenCalled();
  });

  it("logs an unexpected failure alongside the issue", () => {
    reportQueryError(new ApiError(500, "boom", null, [], { requestId: "req-1" }), "query", [
      "vacations",
    ]);

    expect(Sentry.logger.error).toHaveBeenCalledWith(
      expect.stringContaining("boom"),
      expect.objectContaining({ "request.id": "req-1" })
    );
  });

  it("captures a 500 with the correlation tags", () => {
    const error = new ApiError(500, "Internal Server Error", null, [], {
      requestId: "req-abc",
      path: "/api/vacation",
    });

    reportQueryError(error, "query", ["vacations", "2026"]);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [captured, options] = vi.mocked(Sentry.captureException).mock.calls[0];
    expect(captured).toBe(error);
    expect(options?.tags).toMatchObject({
      source: "tanstack.query",
      query_key: "vacations",
      http_status: "500",
      request_id: "req-abc",
    });
    expect(options?.contexts?.request).toMatchObject({
      path: "/api/vacation",
      status: 500,
      request_id: "req-abc",
    });
  });

  it("tags mutations distinctly", () => {
    reportQueryError(new ApiError(500, "boom"), "mutation", ["createVacation"]);

    const [, options] = vi.mocked(Sentry.captureException).mock.calls[0];
    expect(options?.tags?.source).toBe("tanstack.mutation");
  });

  it("captures an error with no query key", () => {
    reportQueryError(new TypeError("Failed to fetch"), "query");

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(Sentry.captureException).mock.calls[0];
    expect(options?.tags?.query_key).toBeUndefined();
    expect(options?.tags?.http_status).toBeUndefined();
  });
});
