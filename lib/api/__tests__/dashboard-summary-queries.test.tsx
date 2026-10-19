import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { DashboardSummary } from "../types";

const apiMock = vi.fn();
vi.mock("../client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../client")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

import { qk, useDashboardSummary } from "../queries";

const summary: DashboardSummary = {
  pendingApprovalsCount: 0,
  outTodayCount: 1,
  workingTodayCount: 2,
  upcomingNext14DaysCount: 3,
  teamSize: 3,
};

function setup(today: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDashboardSummary(today), { wrapper });
  return { client, result };
}

describe("useDashboardSummary", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue(summary);
  });

  it("asks for the counts of the caller's own day and keys them by it", async () => {
    const { client, result } = setup("2026-10-13");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/dashboard-summary?today=2026-10-13");
    expect(client.getQueryData(qk.dashboardSummary("2026-10-13"))).toEqual(summary);
    expect(client.getQueryData(qk.dashboardSummary("2026-10-14"))).toBeUndefined();
  });
});
