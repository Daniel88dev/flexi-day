import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { GroupEventRow } from "../group-events";

const listMock = vi.fn();
const groupsMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const impactMock = vi.fn();
vi.mock("../group-events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../group-events")>()),
  listGroupEvents: (...args: unknown[]) => listMock(...args),
  listGroupEventGroups: (...args: unknown[]) => groupsMock(...args),
  createGroupEvent: (...args: unknown[]) => createMock(...args),
  updateGroupEvent: (...args: unknown[]) => updateMock(...args),
  deleteGroupEvent: (...args: unknown[]) => deleteMock(...args),
  groupEventImpact: (...args: unknown[]) => impactMock(...args),
}));

import {
  invalidateGroupEventDependants,
  qk,
  useCreateGroupEvent,
  useDeleteGroupEvent,
  useGroupEventGroups,
  useGroupEventImpact,
  useGroupEvents,
  useUpdateGroupEvent,
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

describe("group event writes", () => {
  const WRITE = { droppedOneOffs: 0, events: [ROW], deletedIds: [] };

  async function expectRefetchAfter(run: (client: QueryClient) => Promise<unknown>) {
    listMock.mockReset().mockResolvedValue([ROW]);
    groupsMock.mockReset().mockResolvedValue([]);
    const { client, wrapper } = setup();
    renderHook(() => useGroupEvents({ year: 2026, month: 10, groupId: null }), { wrapper });
    renderHook(() => useGroupEventGroups(), { wrapper });
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(groupsMock).toHaveBeenCalledTimes(1));

    await run(client);

    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(groupsMock).toHaveBeenCalledTimes(2));
  }

  it("refetches the calendar and the create rights after a create", async () => {
    createMock.mockReset().mockResolvedValue(ROW);
    await expectRefetchAfter(async (client) => {
      const { result } = renderHook(() => useCreateGroupEvent(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      });
      await result.current.mutateAsync({
        groupId: "g-1",
        title: "Offsite",
        startDate: "2026-10-21",
      });
    });
    expect(createMock).toHaveBeenCalledWith({
      groupId: "g-1",
      title: "Offsite",
      startDate: "2026-10-21",
    });
  });

  it("refetches after an edit", async () => {
    updateMock.mockReset().mockResolvedValue(WRITE);
    await expectRefetchAfter(async (client) => {
      const { result } = renderHook(() => useUpdateGroupEvent(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      });
      await result.current.mutateAsync({ id: "ge-1", request: { changes: { title: "Retro" } } });
    });
    expect(updateMock).toHaveBeenCalledWith("ge-1", { changes: { title: "Retro" } });
  });

  it("refetches after a delete", async () => {
    deleteMock.mockReset().mockResolvedValue({ ...WRITE, events: [], deletedIds: ["ge-1"] });
    await expectRefetchAfter(async (client) => {
      const { result } = renderHook(() => useDeleteGroupEvent(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      });
      await result.current.mutateAsync({ id: "ge-1", request: { scope: "all" } });
    });
    expect(deleteMock).toHaveBeenCalledWith("ge-1", { scope: "all" });
  });
});

describe("useGroupEventImpact", () => {
  it("asks for the dry run only while enabled", async () => {
    impactMock.mockReset().mockResolvedValue({ droppedOneOffs: 3 });
    const { wrapper } = setup();
    const request = {
      scope: "all" as const,
      occurrenceDate: "2026-10-19",
      changes: { repeat: null },
    };
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useGroupEventImpact("ge-1", request, enabled),
      { wrapper, initialProps: { enabled: false } }
    );
    expect(impactMock).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.data).toEqual({ droppedOneOffs: 3 }));
    expect(impactMock).toHaveBeenCalledWith("ge-1", request);
  });
});
