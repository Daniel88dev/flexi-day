import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  createGroupEvent,
  deleteGroupEvent,
  groupEventImpact,
  listGroupEventGroups,
  listGroupEvents,
  updateGroupEvent,
} from "../group-events";

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

describe("createGroupEvent", () => {
  it("posts the body to the collection", async () => {
    apiMock.mockReset().mockResolvedValue({ id: "ge-1" });
    const body = { groupId: "g-1", title: "Standup", startDate: "2026-10-19" };
    await createGroupEvent(body);
    expect(apiMock).toHaveBeenCalledWith("/api/group-events", { method: "POST", body });
  });
});

describe("updateGroupEvent", () => {
  it("patches one group event with the scope, the date and the changes", async () => {
    apiMock.mockReset().mockResolvedValue({ droppedOneOffs: 0, events: [], deletedIds: [] });
    await updateGroupEvent("ge-1", {
      scope: "this",
      occurrenceDate: "2026-10-19",
      changes: { title: "Retro" },
    });
    expect(apiMock).toHaveBeenCalledWith("/api/group-events/ge-1", {
      method: "PATCH",
      body: { scope: "this", occurrenceDate: "2026-10-19", changes: { title: "Retro" } },
    });
  });
});

describe("groupEventImpact", () => {
  it("sends the changes as a JSON string beside the scope and date", async () => {
    apiMock.mockReset().mockResolvedValue({ droppedOneOffs: 2 });
    await expect(
      groupEventImpact("ge-1", {
        scope: "all",
        occurrenceDate: "2026-10-19",
        changes: { repeat: null },
      })
    ).resolves.toEqual({ droppedOneOffs: 2 });
    const [path] = apiMock.mock.calls[0] as [string];
    const url = new URL(path, "http://x");
    expect(url.pathname).toBe("/api/group-events/ge-1/impact");
    expect(url.searchParams.get("scope")).toBe("all");
    expect(url.searchParams.get("occurrenceDate")).toBe("2026-10-19");
    expect(JSON.parse(url.searchParams.get("changes")!)).toEqual({ repeat: null });
  });
});

describe("deleteGroupEvent", () => {
  it("deletes with the scope and date in the query", async () => {
    apiMock.mockReset().mockResolvedValue({ droppedOneOffs: 0, events: [], deletedIds: ["ge-1"] });
    await deleteGroupEvent("ge-1", { scope: "following", occurrenceDate: "2026-10-26" });
    expect(apiMock).toHaveBeenCalledWith(
      "/api/group-events/ge-1?scope=following&occurrenceDate=2026-10-26",
      { method: "DELETE" }
    );
  });

  it("deletes a one-off without a query", async () => {
    apiMock.mockReset().mockResolvedValue({ droppedOneOffs: 0, events: [], deletedIds: ["ge-1"] });
    await deleteGroupEvent("ge-1", {});
    expect(apiMock).toHaveBeenCalledWith("/api/group-events/ge-1", { method: "DELETE" });
  });
});
