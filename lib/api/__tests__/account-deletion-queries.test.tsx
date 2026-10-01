import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getStatusMock = vi.fn();
const deleteMock = vi.fn();
vi.mock("../account-deletion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../account-deletion")>()),
  getAccountDeletionStatus: () => getStatusMock(),
  deleteMyAccount: (password?: string) => deleteMock(password),
}));

import { qk, useAccountDeletionStatus, useDeleteMyAccount } from "../queries";

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

describe("useAccountDeletionStatus", () => {
  beforeEach(() => getStatusMock.mockReset());

  it("caches the deletion status under its own key", async () => {
    const status = { canDelete: true, blockers: [], confirmation: "password" };
    getStatusMock.mockResolvedValue(status);
    const { client, wrapper: Wrapper } = wrapper();

    const { result } = renderHook(() => useAccountDeletionStatus(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(status));
    expect(client.getQueryData(qk.accountDeletion())).toEqual(status);
  });
});

describe("useDeleteMyAccount", () => {
  beforeEach(() => deleteMock.mockReset());

  it("sends the password it is given", async () => {
    deleteMock.mockResolvedValue(undefined);
    const { wrapper: Wrapper } = wrapper();

    const { result } = renderHook(() => useDeleteMyAccount(), { wrapper: Wrapper });
    await result.current.mutateAsync("hunter22");

    expect(deleteMock).toHaveBeenCalledWith("hunter22");
  });
});
