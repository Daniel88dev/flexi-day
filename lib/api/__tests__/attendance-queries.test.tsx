import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getMock = vi.fn();
const clockInMock = vi.fn();
const clockOutMock = vi.fn();
const startBreakMock = vi.fn();
const endBreakMock = vi.fn();

vi.mock("../attendance", () => ({
  getAttendanceState: (...args: unknown[]) => getMock(...args),
  clockIn: (...args: unknown[]) => clockInMock(...args),
  clockOut: (...args: unknown[]) => clockOutMock(...args),
  startBreak: (...args: unknown[]) => startBreakMock(...args),
  endBreak: (...args: unknown[]) => endBreakMock(...args),
}));

import {
  qk,
  useAttendanceState,
  useClockIn,
  useClockOut,
  useEndBreak,
  useStartBreak,
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

describe("useAttendanceState", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("reads the caller's own clock with no organization named", async () => {
    getMock.mockResolvedValue({ organizationId: "org-1", active: true });
    const { wrapper } = setup();

    const { result } = renderHook(() => useAttendanceState(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual({ organizationId: "org-1", active: true });
  });

  it("asks even without an organization — unlike the org-admin settings read", () => {
    getMock.mockResolvedValue({});
    const { wrapper } = setup();

    renderHook(() => useAttendanceState(null), { wrapper });

    expect(getMock).toHaveBeenCalledWith(null);
  });
});

describe("the clock writes", () => {
  beforeEach(() => {
    for (const mock of [getMock, clockInMock, clockOutMock, startBreakMock, endBreakMock]) {
      mock.mockReset();
      mock.mockResolvedValue({});
    }
  });

  it.each([
    ["useClockIn", useClockIn, () => clockInMock],
    ["useClockOut", useClockOut, () => clockOutMock],
    ["useStartBreak", useStartBreak, () => startBreakMock],
    ["useEndBreak", useEndBreak, () => endBreakMock],
  ])("%s posts with the organization it was given", async (_name, useWrite, mock) => {
    const { wrapper } = setup();

    const { result } = renderHook(() => useWrite("org-1"), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mock()).toHaveBeenCalledWith("org-1");
  });

  it("refreshes a state read cached under a different scope than the write named", async () => {
    const { client, wrapper } = setup();
    // What the widget actually does: read unscoped, write with the
    // organization that read answered with.
    client.setQueryData(qk.attendanceState(), { organizationId: "org-1", active: true });
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useClockIn("org-1"), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["attendance-state"] });
  });

  it("refreshes on a rejected write too — a 409 means the widget was stale", async () => {
    clockInMock.mockRejectedValue(new Error("nope"));
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useClockIn(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["attendance-state"] });
  });
});
