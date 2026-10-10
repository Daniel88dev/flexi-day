import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { listMyPendingRequests } from "../approvals";

describe("listMyPendingRequests", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue([]);
  });

  it("GETs the caller's own requests still waiting on an Approver", async () => {
    await listMyPendingRequests();
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/pending-requests");
  });
});
