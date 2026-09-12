import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const clockInMock = vi.fn();
const clockOutMock = vi.fn();
const updateSessionLocationMock = vi.fn();

vi.mock("../attendance", () => ({
  getAttendanceState: vi.fn(),
  clockIn: (...args: unknown[]) => clockInMock(...args),
  clockOut: (...args: unknown[]) => clockOutMock(...args),
  startBreak: vi.fn(),
  endBreak: vi.fn(),
  updateSessionLocation: (...args: unknown[]) => updateSessionLocationMock(...args),
}));

import { useClockIn, useClockOut } from "../queries";

const getCurrentPosition = vi.fn();

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("the clock's location capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clockInMock.mockResolvedValue({ id: "session-1" });
    clockOutMock.mockResolvedValue({ id: "session-1" });
    updateSessionLocationMock.mockResolvedValue({ applied: true });
    getCurrentPosition.mockImplementation((onFix: PositionCallback) =>
      onFix({
        coords: { latitude: 50.0755, longitude: 14.4378, accuracy: 25 },
      } as GeolocationPosition)
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never asks the browser while the organization has location off", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useClockIn("org-1"), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(clockInMock).toHaveBeenCalled());
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(updateSessionLocationMock).not.toHaveBeenCalled();
  });

  it("asks twice and sends both fixes when location is on", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useClockIn("org-1", true), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(updateSessionLocationMock).toHaveBeenCalledTimes(2));
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(updateSessionLocationMock).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ end: "IN" })
    );
  });

  it("tags a clock-out's fixes as the OUT end", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useClockOut("org-1", true), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(updateSessionLocationMock).toHaveBeenCalledTimes(2));
    expect(updateSessionLocationMock).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ end: "OUT" })
    );
  });

  it("leaves the clock itself successful when the person declines", async () => {
    getCurrentPosition.mockImplementation(
      (_onFix: PositionCallback, onError: PositionErrorCallback) =>
        onError({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useClockIn("org-1", true), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.error).toBeNull();
    expect(updateSessionLocationMock).not.toHaveBeenCalled();
  });

  it("leaves the clock successful when the update itself fails", async () => {
    updateSessionLocationMock.mockRejectedValue(new Error("offline"));
    const { wrapper } = setup();
    const { result } = renderHook(() => useClockIn("org-1", true), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it("refetches the day once the fixes have landed, so they are visible", async () => {
    const { wrapper, client } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useClockIn("org-1", true), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(updateSessionLocationMock).toHaveBeenCalledTimes(2));
    // Once on the mutation settling, once more when the slow fix is in.
    await waitFor(() =>
      expect(
        invalidate.mock.calls.filter(
          ([options]) => JSON.stringify(options?.queryKey) === JSON.stringify(["attendance-state"])
        ).length
      ).toBeGreaterThanOrEqual(2)
    );
  });
});
