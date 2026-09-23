import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const dayMock = vi.fn();
const eventsMock = vi.fn();
const correctSessionMock = vi.fn();
const correctBreakMock = vi.fn();
const removeBreakMock = vi.fn();
const removeSessionMock = vi.fn();
const enterSessionMock = vi.fn();
const addBreakMock = vi.fn();

vi.mock("../attendance", () => ({
  getAttendanceDay: (...args: unknown[]) => dayMock(...args),
  getSessionEvents: (...args: unknown[]) => eventsMock(...args),
  correctSession: (...args: unknown[]) => correctSessionMock(...args),
  correctBreak: (...args: unknown[]) => correctBreakMock(...args),
  removeBreak: (...args: unknown[]) => removeBreakMock(...args),
  removeSession: (...args: unknown[]) => removeSessionMock(...args),
  enterSession: (...args: unknown[]) => enterSessionMock(...args),
  addBreak: (...args: unknown[]) => addBreakMock(...args),
}));

import {
  qk,
  useAddBreak,
  useAttendanceDay,
  useCorrectBreak,
  useCorrectSession,
  useEnterSession,
  useRemoveBreak,
  useRemoveSession,
  useSessionEvents,
} from "../queries";

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const params = { organizationId: "org-1", businessDate: "2026-09-09", userId: "user-2" };

describe("useAttendanceDay", () => {
  beforeEach(() => {
    dayMock.mockReset();
    dayMock.mockResolvedValue({ sessions: [] });
  });

  it("reads the day the dialog was opened on", async () => {
    const { wrapper } = setup();

    const { result } = renderHook(() => useAttendanceDay(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(dayMock).toHaveBeenCalledWith(params);
  });

  it("asks for nothing while the dialog is closed", () => {
    const { wrapper } = setup();

    renderHook(() => useAttendanceDay(params, false), { wrapper });
    renderHook(() => useAttendanceDay(null), { wrapper });

    expect(dayMock).not.toHaveBeenCalled();
  });

  it("keys a day by its organization, its date and whose it is", () => {
    expect(qk.attendanceDay(params)).toEqual(["attendance-day", "org-1", "2026-09-09", "user-2"]);
    expect(qk.attendanceDay({ organizationId: "org-1", businessDate: "2026-09-09" })).toEqual([
      "attendance-day",
      "org-1",
      "2026-09-09",
      "own",
    ]);
  });
});

describe("useSessionEvents", () => {
  beforeEach(() => {
    eventsMock.mockReset();
    eventsMock.mockResolvedValue([]);
  });

  it("reads one session's timeline", async () => {
    const { wrapper } = setup();

    const { result } = renderHook(() => useSessionEvents("session-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventsMock).toHaveBeenCalledWith("session-1");
  });

  it("asks for nothing without a session", () => {
    const { wrapper } = setup();

    renderHook(() => useSessionEvents(null), { wrapper });

    expect(eventsMock).not.toHaveBeenCalled();
  });
});

describe("the correction mutations", () => {
  beforeEach(() => {
    for (const mock of [
      correctSessionMock,
      correctBreakMock,
      removeBreakMock,
      removeSessionMock,
      enterSessionMock,
      addBreakMock,
    ]) {
      mock.mockReset();
      mock.mockResolvedValue({ id: "session-1" });
    }
  });

  it("passes each correction through to its own endpoint", async () => {
    const { wrapper } = setup();

    const session = renderHook(() => useCorrectSession(), { wrapper });
    await session.result.current.mutateAsync({
      sessionId: "session-1",
      patch: { endedAt: "2026-09-09T15:10:00.000Z" },
    });
    expect(correctSessionMock).toHaveBeenCalledWith("session-1", {
      endedAt: "2026-09-09T15:10:00.000Z",
    });

    const entry = renderHook(() => useCorrectBreak(), { wrapper });
    await entry.result.current.mutateAsync({ breakId: "break-1", patch: { endedAt: null } });
    expect(correctBreakMock).toHaveBeenCalledWith("break-1", { endedAt: null });

    const dropped = renderHook(() => useRemoveBreak(), { wrapper });
    await dropped.result.current.mutateAsync("break-1");
    expect(removeBreakMock).toHaveBeenCalledWith("break-1");

    const deleted = renderHook(() => useRemoveSession(), { wrapper });
    await deleted.result.current.mutateAsync("session-1");
    expect(removeSessionMock).toHaveBeenCalledWith("session-1");

    const entered = renderHook(() => useEnterSession(), { wrapper });
    const recorded = {
      organizationId: "org-1",
      businessDate: "2026-09-08",
      startedAt: "2026-09-08T06:10:00.000Z",
      endedAt: "2026-09-08T14:55:00.000Z",
    };
    await entered.result.current.mutateAsync(recorded);
    expect(enterSessionMock).toHaveBeenCalledWith(recorded);

    const added = renderHook(() => useAddBreak(), { wrapper });
    const span = { startedAt: "2026-09-09T13:00:00.000Z", endedAt: "2026-09-09T13:20:00.000Z" };
    await added.result.current.mutateAsync({ sessionId: "session-1", span });
    expect(addBreakMock).toHaveBeenCalledWith("session-1", span);
  });

  it("drops the day and the session's timeline after an added break", async () => {
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useAddBreak(), { wrapper });
    await result.current.mutateAsync({
      sessionId: "session-1",
      span: { startedAt: "2026-09-09T13:00:00.000Z", endedAt: "2026-09-09T13:20:00.000Z" },
    });

    const keys = invalidate.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(["attendance-day"]));
    expect(keys).toContain(JSON.stringify(["attendance-month"]));
    expect(keys).toContain(JSON.stringify(qk.attendanceEvents("session-1")));
  });

  it("drops the same reads after an entry, and the entered session's timeline", async () => {
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useEnterSession(), { wrapper });
    await result.current.mutateAsync({
      organizationId: "org-1",
      businessDate: "2026-09-08",
      startedAt: "2026-09-08T06:10:00.000Z",
      endedAt: "2026-09-08T14:55:00.000Z",
    });

    const keys = invalidate.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(["attendance-month"]));
    expect(keys).toContain(JSON.stringify(qk.attendanceEvents("session-1")));
  });

  it("drops every attendance read a correction could have moved, and that session's timeline", async () => {
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCorrectSession(), { wrapper });
    await result.current.mutateAsync({ sessionId: "session-1", patch: { endedAt: null } });

    const keys = invalidate.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toEqual([
      JSON.stringify(["attendance-day"]),
      JSON.stringify(["attendance-month"]),
      JSON.stringify(["attendance-team"]),
      JSON.stringify(["attendance-state"]),
      JSON.stringify(qk.attendanceEvents("session-1")),
    ]);
  });
});
