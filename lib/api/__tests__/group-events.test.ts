import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { listGroupEventGroups, listGroupEvents } from "../group-events";

describe("listGroupEvents", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue([]);
  });

  it("asks for every group of the caller's without a group", async () => {
    await listGroupEvents({ year: 2026, month: 10, groupId: null });
    expect(apiMock).toHaveBeenCalledWith("/api/group-events?year=2026&month=10");
  });

  it("asks for one group's events with its id", async () => {
    await listGroupEvents({ year: 2026, month: 11, groupId: "g-1" });
    expect(apiMock).toHaveBeenCalledWith("/api/group-events?year=2026&month=11&groupId=g-1");
  });
});

describe("listGroupEventGroups", () => {
  it("reads the caller's groups with their create right", async () => {
    apiMock.mockReset().mockResolvedValue([{ groupId: "g-1", groupName: "Dev", canCreate: true }]);
    await expect(listGroupEventGroups()).resolves.toEqual([
      { groupId: "g-1", groupName: "Dev", canCreate: true },
    ]);
    expect(apiMock).toHaveBeenCalledWith("/api/group-events/groups");
  });
});
