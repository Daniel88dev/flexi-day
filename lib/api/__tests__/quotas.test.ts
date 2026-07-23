import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { listQuotas, setUserQuota } from "../quotas";

describe("quotas api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("listQuotas GETs the group collection without a query string by default", async () => {
    await listQuotas("g-1");
    expect(apiMock).toHaveBeenCalledWith("/api/quotas/g-1");
  });

  it("listQuotas passes year and userId as query params", async () => {
    await listQuotas("g-1", { year: 2026, userId: "u-1" });
    expect(apiMock).toHaveBeenCalledWith("/api/quotas/g-1?year=2026&userId=u-1");
  });

  it("setUserQuota PUTs the allowance with the groupId in the path only", async () => {
    await setUserQuota({
      groupId: "g-1",
      userId: "u-1",
      year: 2026,
      vacationDays: 25,
      homeOfficeDays: 60,
    });
    expect(apiMock).toHaveBeenCalledWith("/api/quotas/g-1", {
      method: "PUT",
      body: { userId: "u-1", year: 2026, vacationDays: 25, homeOfficeDays: 60 },
    });
  });
});
