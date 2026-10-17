import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { GroupEventRow } from "../group-events";

const listMock = vi.fn();
const groupsMock = vi.fn();
vi.mock("../group-events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../group-events")>()),
  listGroupEvents: (...args: unknown[]) => listMock(...args),
  listGroupEventGroups: (...args: unknown[]) => groupsMock(...args),
}));

import {
  invalidateGroupEventDependants,
  qk,
  useGroupEventGroups,
  useGroupEvents,
} from "../queries";

const ROW: GroupEventRow = {
  id: "ge-1",
  groupId: "g-1",
  groupName: "Dev Team",
  title: "Offsite",
  note: null,
  startDate: "2026-10-21",
  endDate: "2026-10-23",
  startTime: null,
  endTime: null,
  repeat: null,
  skippedDates: [],
  recurringEventId: null,
  originalDate: null,
  createdBy: null,
  canEdit: false,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("useGroupEvents", () => {
  beforeEach(() => listMock.mockReset().mockResolvedValue([ROW]));

  it("reads the month's group events under the group-events prefix", async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useGroupEvents({ year: 2026, month: 10, groupId: "g-1" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMock).toHaveBeenCalledWith({ year: 2026, month: 10, groupId: "g-1" });
    expect(client.getQueryData(["group-events", 2026, 10, "g-1"])).toEqual([ROW]);
  });

  it("keys Mine scope apart from every group", () => {
    expect(qk.groupEvents(2026, 10, null)).toEqual(["group-events", 2026, 10, "mine"]);
    expect(qk.groupEvents(2026, 10, "g-1")).not.toEqual(qk.groupEvents(2026, 10, null));
  });
});

describe("useGroupEventGroups", () => {
  it("reads the caller's groups under the group-events prefix", async () => {
    groupsMock
      .mockReset()
      .mockResolvedValue([{ groupId: "g-1", groupName: "Dev", canCreate: true }]);
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useGroupEventGroups(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(["group-events", "groups"])).toEqual([
      { groupId: "g-1", groupName: "Dev", canCreate: true },
    ]);
  });
});

describe("invalidateGroupEventDependants", () => {
  it("refetches every month's group events and the create rights after a write", async () => {
    listMock.mockReset().mockResolvedValue([ROW]);
    groupsMock.mockReset().mockResolvedValue([]);
    const { client, wrapper } = setup();
    renderHook(() => useGroupEvents({ year: 2026, month: 10, groupId: null }), { wrapper });
    renderHook(() => useGroupEventGroups(), { wrapper });
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(groupsMock).toHaveBeenCalledTimes(1));
    client.setQueryData(qk.groupEvents(2026, 11, "g-1"), [ROW]);

    await invalidateGroupEventDependants(client);

    expect(listMock).toHaveBeenCalledTimes(2);
    expect(groupsMock).toHaveBeenCalledTimes(2);
    expect(client.getQueryState(qk.groupEvents(2026, 11, "g-1"))?.isInvalidated).toBe(true);
  });
});
