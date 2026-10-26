import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listRequestedMock = vi.fn();
const requestMock = vi.fn();
const getOrganizationMock = vi.fn();
const requestOrganizationMock = vi.fn();
vi.mock("../person-export", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../person-export")>()),
  listRequestedExports: (...args: unknown[]) => listRequestedMock(...args),
  requestPersonExport: (...args: unknown[]) => requestMock(...args),
  getOrganizationExport: (...args: unknown[]) => getOrganizationMock(...args),
  requestOrganizationExport: (...args: unknown[]) => requestOrganizationMock(...args),
}));

import {
  useOrganizationExport,
  useRequestOrganizationExport,
  useRequestPersonExport,
  useRequestedExports,
} from "../queries";

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const wrapperFor =
  (client: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

const entry = (status: "PENDING" | "READY") => ({
  id: "exp-1",
  organizationId: "org-1",
  subjectUserId: "u-1",
  status,
  createdAt: "2026-10-25T10:00:00Z",
  readyAt: null,
  expiresAt: null,
});

describe("useRequestedExports", () => {
  it("asks again while an export is preparing, and stops once it is ready", async () => {
    listRequestedMock.mockResolvedValueOnce([entry("PENDING")]).mockResolvedValue([entry("READY")]);
    const { result } = renderHook(() => useRequestedExports("org-1"), {
      wrapper: wrapperFor(newClient()),
    });

    await waitFor(() => expect(result.current.data?.[0]?.status).toBe("READY"), {
      timeout: 5000,
    });
    expect(listRequestedMock).toHaveBeenCalledWith("org-1");
    expect(listRequestedMock).toHaveBeenCalledTimes(2);
  });
});

describe("useRequestPersonExport", () => {
  it("refreshes every export list once the request lands", async () => {
    requestMock.mockResolvedValue(entry("PENDING"));
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRequestPersonExport(), { wrapper: wrapperFor(client) });

    result.current.mutate("emp-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestMock).toHaveBeenCalledWith("emp-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["person-exports"] });
  });
});

describe("useOrganizationExport", () => {
  it("asks again while the export is preparing, and stops once it is ready", async () => {
    getOrganizationMock.mockResolvedValueOnce(entry("PENDING")).mockResolvedValue(entry("READY"));
    const { result } = renderHook(() => useOrganizationExport("org-1"), {
      wrapper: wrapperFor(newClient()),
    });

    await waitFor(() => expect(result.current.data?.status).toBe("READY"), { timeout: 5000 });
    expect(getOrganizationMock).toHaveBeenCalledWith("org-1");
    expect(getOrganizationMock).toHaveBeenCalledTimes(2);
  });

  it("asks nothing when the caller is not the owner", () => {
    getOrganizationMock.mockClear();
    renderHook(() => useOrganizationExport("org-1", false), { wrapper: wrapperFor(newClient()) });
    expect(getOrganizationMock).not.toHaveBeenCalled();
  });
});

describe("useRequestOrganizationExport", () => {
  it("refreshes the organization's export once the request lands", async () => {
    requestOrganizationMock.mockResolvedValue(entry("PENDING"));
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRequestOrganizationExport("org-1"), {
      wrapper: wrapperFor(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestOrganizationMock).toHaveBeenCalledWith("org-1");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["person-exports", "organization", "org-1"],
    });
  });
});
