import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getTeamMock = vi.fn();

vi.mock("../attendance", () => ({
  getTeamAttendance: (...args: unknown[]) => getTeamMock(...args),
}));

import { qk, useTeamAttendance } from "../queries";

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const params = { organizationId: "org-1", from: "2026-09-07", to: "2026-09-13" };

describe("useTeamAttendance", () => {
  beforeEach(() => {
    getTeamMock.mockReset();
    getTeamMock.mockResolvedValue({ people: [] });
  });

  it("reads the team for the range and caches it under its own key", async () => {
    const { client, wrapper } = setup();

    const { result } = renderHook(() => useTeamAttendance(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTeamMock).toHaveBeenCalledWith(params);
    expect(client.getQueryData(qk.attendanceTeam(params))).toEqual({ people: [] });
  });

  it("keys a group filter separately from the whole audience", () => {
    expect(qk.attendanceTeam(params)).not.toEqual(qk.attendanceTeam({ ...params, groupId: "eng" }));
    expect(qk.attendanceTeam(params)).toEqual(qk.attendanceTeam({ ...params, groupId: null }));
  });

  it("asks nothing without an organization, or when told the viewer administers nothing", () => {
    const { wrapper } = setup();

    renderHook(() => useTeamAttendance(null), { wrapper });
    renderHook(() => useTeamAttendance(params, false), { wrapper });

    expect(getTeamMock).not.toHaveBeenCalled();
  });
});
