import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const updateGroupUsersMock = vi.fn();
vi.mock("../group-users", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../group-users")>()),
  updateGroupUsers: (...args: unknown[]) => updateGroupUsersMock(...args),
}));

import { qk, useUpdateGroupUsers } from "../queries";

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

describe("useUpdateGroupUsers", () => {
  it("refetches the member list after a refused save, so the editor sees who left", async () => {
    updateGroupUsersMock.mockRejectedValue(new Error("refused"));
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateGroupUsers(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ groupId: "g-1", data: [] });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.groupUsers("g-1") });
  });
});
