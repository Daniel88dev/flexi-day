import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "../client";

const listCalendarSyncsMock = vi.fn();
vi.mock("../calendar-sync", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../calendar-sync")>()),
  listCalendarSyncs: (...args: unknown[]) => listCalendarSyncsMock(...args),
}));

const listConnectionsMock = vi.fn();
const startConnectionMock = vi.fn();
const disconnectMock = vi.fn();
const setTargetMock = vi.fn();
const removeTargetMock = vi.fn();
const syncNowMock = vi.fn();
vi.mock("../calendar-connections", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../calendar-connections")>()),
  listConnections: (...args: unknown[]) => listConnectionsMock(...args),
  startConnection: (...args: unknown[]) => startConnectionMock(...args),
  disconnectCalendar: (...args: unknown[]) => disconnectMock(...args),
  setCalendarTarget: (...args: unknown[]) => setTargetMock(...args),
  removeCalendarTarget: (...args: unknown[]) => removeTargetMock(...args),
  syncCalendarNow: (...args: unknown[]) => syncNowMock(...args),
}));

import {
  CALENDAR_SYNCING_REFETCH_MS,
  qk,
  useCalendarConnections,
  useCalendarSyncs,
  useDisconnectCalendar,
  useRemoveCalendarTarget,
  useSetCalendarTarget,
  useStartCalendarConnection,
  useSyncCalendarNow,
} from "../queries";

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function renderWith<T>(hook: () => T) {
  const client = newClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const view = renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...view, client, invalidate };
}

const invalidatedKeys = (invalidate: { mock: { calls: unknown[][] } }) =>
  invalidate.mock.calls.map(([filters]) => (filters as { queryKey: unknown }).queryKey);

const needsReconnect = () =>
  new ApiError(409, "Reconnect the calendar account before syncing", undefined, [
    {
      message: "Reconnect the calendar account before syncing",
      context: { code: "CALENDAR_SYNC_NEEDS_RECONNECT" },
    },
  ]);

beforeEach(() => {
  for (const mock of [
    listCalendarSyncsMock,
    listConnectionsMock,
    startConnectionMock,
    disconnectMock,
    setTargetMock,
    removeTargetMock,
    syncNowMock,
  ]) {
    mock.mockReset();
  }
});

const config = (syncing: boolean | null) => ({
  id: "cfg-1",
  target:
    syncing === null
      ? null
      : {
          provider: "GOOGLE",
          status: "ACTIVE",
          capability: "STATUS",
          timeZone: "Europe/Prague",
          lastSyncedAt: null,
          lastError: null,
          syncing,
        },
});

describe("useCalendarSyncs", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("returns fresh configs on an interval while a target is syncing", async () => {
    listCalendarSyncsMock.mockResolvedValue([config(null), config(true)]);
    const { result } = renderWith(() => useCalendarSyncs());
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(listCalendarSyncsMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(CALENDAR_SYNCING_REFETCH_MS + 100);

    expect(listCalendarSyncsMock).toHaveBeenCalledTimes(2);
  });

  it("returns the configs once when no target is syncing", async () => {
    listCalendarSyncsMock.mockResolvedValue([config(null), config(false)]);
    const { result } = renderWith(() => useCalendarSyncs());
    await waitFor(() => expect(result.current.data).toHaveLength(2));

    await vi.advanceTimersByTimeAsync(CALENDAR_SYNCING_REFETCH_MS * 3);

    expect(listCalendarSyncsMock).toHaveBeenCalledTimes(1);
  });
});

describe("useCalendarConnections", () => {
  it("returns the connections, cached under their own key", async () => {
    const body = { providers: { google: true, microsoft: false }, connections: [] };
    listConnectionsMock.mockResolvedValue(body);

    const { result, client } = renderWith(() => useCalendarConnections());

    await waitFor(() => expect(result.current.data).toEqual(body));
    expect(client.getQueryData(qk.calendarConnections())).toEqual(body);
  });
});

describe("useStartCalendarConnection", () => {
  let assignMock: ReturnType<typeof vi.fn>;
  let restoreLocation: () => void;

  beforeEach(() => {
    // A plain stand-in: jsdom does not implement navigation.
    const original = Object.getOwnPropertyDescriptor(window, "location")!;
    assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: assignMock },
    });
    restoreLocation = () => Object.defineProperty(window, "location", original);
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "Europe/Prague",
    } as Intl.ResolvedDateTimeFormatOptions);
  });

  afterEach(() => {
    restoreLocation();
    vi.restoreAllMocks();
  });

  it("returns the consent url and sends the browser there, started in the browser's zone", async () => {
    startConnectionMock.mockResolvedValue({ url: "https://consent.example/?state=s" });
    const { result } = renderWith(() => useStartCalendarConnection());

    await result.current.mutateAsync({ provider: "google", configId: "cfg-1" });

    expect(startConnectionMock).toHaveBeenCalledWith("google", {
      configId: "cfg-1",
      timeZone: "Europe/Prague",
    });
    expect(assignMock).toHaveBeenCalledWith("https://consent.example/?state=s");
  });

  it("returns the refusal without navigating and refetches both lists", async () => {
    startConnectionMock.mockRejectedValue(
      new ApiError(404, "This calendar provider is not available")
    );
    const { result, invalidate } = renderWith(() => useStartCalendarConnection());

    await expect(
      result.current.mutateAsync({ provider: "microsoft", configId: "cfg-1" })
    ).rejects.toBeInstanceOf(ApiError);

    expect(assignMock).not.toHaveBeenCalled();
    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([qk.calendarSyncs(), qk.calendarConnections()])
    );
  });
});

describe("useDisconnectCalendar", () => {
  it("returns after disconnecting and refetching the calendars and the connections", async () => {
    disconnectMock.mockResolvedValue({ message: "Calendar disconnected" });
    const { result, invalidate } = renderWith(() => useDisconnectCalendar());

    await result.current.mutateAsync("google");

    expect(disconnectMock).toHaveBeenCalledWith("google");
    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([qk.calendarSyncs(), qk.calendarConnections()])
    );
  });
});

describe("useSetCalendarTarget", () => {
  it("returns after storing the zone and refetching the calendars and the connections", async () => {
    setTargetMock.mockResolvedValue({ id: "cfg-1" });
    const { result, invalidate } = renderWith(() => useSetCalendarTarget());

    await result.current.mutateAsync({ configId: "cfg-1", timeZone: "Asia/Tokyo" });

    expect(setTargetMock).toHaveBeenCalledWith("cfg-1", { timeZone: "Asia/Tokyo" });
    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([qk.calendarSyncs(), qk.calendarConnections()])
    );
  });
});

describe("useRemoveCalendarTarget", () => {
  it("returns after turning the target off and refetching both lists", async () => {
    removeTargetMock.mockResolvedValue({ message: "Direct sync turned off" });
    const { result, invalidate } = renderWith(() => useRemoveCalendarTarget());

    await result.current.mutateAsync("cfg-1");

    expect(removeTargetMock).toHaveBeenCalledWith("cfg-1");
    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([qk.calendarSyncs(), qk.calendarConnections()])
    );
  });
});

describe("useSyncCalendarNow", () => {
  it("returns after queueing the sync and refetching both lists", async () => {
    syncNowMock.mockResolvedValue({ id: "cfg-1" });
    const { result, invalidate } = renderWith(() => useSyncCalendarNow());

    await result.current.mutateAsync("cfg-1");

    expect(syncNowMock).toHaveBeenCalledWith("cfg-1");
    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([qk.calendarSyncs(), qk.calendarConnections()])
    );
  });

  it("returns the needs-reconnect refusal and refetches both lists", async () => {
    syncNowMock.mockRejectedValue(needsReconnect());
    const { result, invalidate } = renderWith(() => useSyncCalendarNow());

    await expect(result.current.mutateAsync("cfg-1")).rejects.toBeInstanceOf(ApiError);

    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([qk.calendarSyncs(), qk.calendarConnections()])
    );
  });
});
