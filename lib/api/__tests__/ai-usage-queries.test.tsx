import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getUsageMock = vi.fn();
const getWeekMock = vi.fn();
const revokeMock = vi.fn();
vi.mock("../ai-usage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../ai-usage")>()),
  getAiUsage: (organizationId: string) => getUsageMock(organizationId),
  getAiUsageWeek: (organizationId: string, weekStart: string) =>
    getWeekMock(organizationId, weekStart),
  revokeAiConnection: (organizationId: string, grantId: string) =>
    revokeMock(organizationId, grantId),
}));

import {
  aiUsageKeys,
  useAiUsage,
  useAiUsageWeek,
  useRevokeAiConnection,
} from "../ai-usage-queries";
import { qk } from "../queries";

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe("useAiUsage", () => {
  beforeEach(() => getUsageMock.mockReset());

  it("waits for an organization, then caches its usage under its own key", async () => {
    getUsageMock.mockResolvedValue({ organizationId: "org-1" });
    const { client, wrapper: Wrapper } = wrapper();

    const idle = renderHook(() => useAiUsage(null), { wrapper: Wrapper });
    expect(idle.result.current.fetchStatus).toBe("idle");
    const { result } = renderHook(() => useAiUsage("org-1"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual({ organizationId: "org-1" }));
    expect(getUsageMock).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(aiUsageKeys.usage("org-1"))).toEqual({ organizationId: "org-1" });
  });
});

describe("useAiUsageWeek", () => {
  beforeEach(() => getWeekMock.mockReset());

  it("fetches a week only while enabled", async () => {
    getWeekMock.mockResolvedValue({ weekStart: "2026-11-02", usedMicroUsd: 1, people: [] });
    const { wrapper: Wrapper } = wrapper();

    renderHook(() => useAiUsageWeek("org-1", "2026-04-13", false), { wrapper: Wrapper });
    const { result } = renderHook(() => useAiUsageWeek("org-1", "2026-11-02", true), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getWeekMock).toHaveBeenCalledTimes(1);
    expect(getWeekMock).toHaveBeenCalledWith("org-1", "2026-11-02");
  });
});

describe("useRevokeAiConnection", () => {
  beforeEach(() => revokeMock.mockReset());

  it("revokes in the organization and refreshes the usage, AI settings and own connections", async () => {
    revokeMock.mockResolvedValue(undefined);
    const { client, wrapper: Wrapper } = wrapper();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useRevokeAiConnection("org-1"), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync("grant-1"));

    expect(revokeMock).toHaveBeenCalledWith("org-1", "grant-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: aiUsageKeys.usage("org-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.aiSettings("org-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.myAiConnections() });
  });
});
