import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../client")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

import {
  aiUsageHref,
  getAiUsage,
  getAiUsageWeek,
  revokeAiConnection,
  weekStartsBefore,
} from "../ai-usage";

describe("ai usage api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue(undefined);
  });

  it("getAiUsage GETs the organization's usage", async () => {
    await getAiUsage("org 1");
    expect(apiMock).toHaveBeenCalledWith("/api/organization/ai/usage?organizationId=org%201");
  });

  it("getAiUsageWeek GETs one week by its Monday", async () => {
    await getAiUsageWeek("org-1", "2026-11-02");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/ai/usage/weeks/2026-11-02?organizationId=org-1"
    );
  });

  it("revokeAiConnection DELETEs the grant in the organization", async () => {
    await revokeAiConnection("org-1", "grant-1");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/ai/connections/grant-1?organizationId=org-1",
      { method: "DELETE" }
    );
  });
});

describe("aiUsageHref", () => {
  it("returns the page for the organization a link knows", () => {
    expect(aiUsageHref("org-1")).toBe("/ai-usage/?organizationId=org-1");
  });

  it("returns the bare page without one", () => {
    expect(aiUsageHref(null)).toBe("/ai-usage/");
    expect(aiUsageHref()).toBe("/ai-usage/");
  });
});

describe("weekStartsBefore", () => {
  it("returns the Mondays before a week and the week itself, oldest first", () => {
    expect(weekStartsBefore("2026-11-09", 3)).toEqual([
      "2026-10-19",
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
    ]);
  });

  it("crosses a daylight-saving change and a year boundary by whole UTC days", () => {
    expect(weekStartsBefore("2026-01-05", 1)).toEqual(["2025-12-29", "2026-01-05"]);
  });
});
