import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getMock = vi.fn();
const updateMock = vi.fn();
vi.mock("../attendance-settings", () => ({
  getAttendanceSettings: (...args: unknown[]) => getMock(...args),
  updateAttendanceSettings: (...args: unknown[]) => updateMock(...args),
}));

import { qk, useAttendanceSettings, useUpdateAttendanceSettings } from "../queries";

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("useAttendanceSettings", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("fetches the settings of the organization it is given", async () => {
    getMock.mockResolvedValue({ organizationId: "org-1", active: true });
    const { wrapper } = setup();

    const { result } = renderHook(() => useAttendanceSettings("org-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("org-1");
    expect(result.current.data).toEqual({ organizationId: "org-1", active: true });
  });

  it("asks for nothing without an organization — the endpoint is org-admin only", () => {
    const { wrapper } = setup();

    renderHook(() => useAttendanceSettings(null), { wrapper });

    expect(getMock).not.toHaveBeenCalled();
  });
});

describe("useUpdateAttendanceSettings", () => {
  beforeEach(() => {
    updateMock.mockReset();
  });

  it("sends the organization alongside the rules, and seeds the cache with the answer", async () => {
    const saved = { organizationId: "org-1", attendanceEnabled: true, active: true };
    updateMock.mockResolvedValue(saved);
    const { client, wrapper } = setup();

    const { result } = renderHook(() => useUpdateAttendanceSettings("org-1"), { wrapper });
    result.current.mutate({ attendanceEnabled: true, timezone: "Europe/Prague" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateMock).toHaveBeenCalledWith({
      organizationId: "org-1",
      attendanceEnabled: true,
      timezone: "Europe/Prague",
    });
    // Seeded from the response, so the card re-renders without a second round trip.
    expect(client.getQueryData(qk.attendanceSettings("org-1"))).toEqual(saved);
  });

  it("leaves the cache alone when the save fails", async () => {
    updateMock.mockRejectedValue(new Error("nope"));
    const { client, wrapper } = setup();

    const { result } = renderHook(() => useUpdateAttendanceSettings("org-1"), { wrapper });
    result.current.mutate({ attendanceEnabled: true, timezone: "Europe/Prague" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(qk.attendanceSettings("org-1"))).toBeUndefined();
  });
});
