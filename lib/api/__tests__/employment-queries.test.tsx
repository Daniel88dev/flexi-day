import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const endEmploymentMock = vi.fn();
const removeGroupUserMock = vi.fn();
vi.mock("../employment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../employment")>()),
  endEmployment: (...args: unknown[]) => endEmploymentMock(...args),
}));
vi.mock("../group-users", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../group-users")>()),
  removeGroupUser: (...args: unknown[]) => removeGroupUserMock(...args),
}));

import { qk, useEndEmployment, useRemoveGroupUser } from "../queries";

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const wrapperFor =
  (client: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

describe("useEndEmployment", () => {
  it("refreshes the roster, the organization's groups, member lists, Team attendance and bookings once it ends", async () => {
    endEmploymentMock.mockResolvedValue({ id: "emp-1", ended: true, cancelledBookings: 1 });
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useEndEmployment("org-1"), {
      wrapper: wrapperFor(client),
    });

    result.current.mutate({ employmentId: "emp-1", endedOn: "2026-10-24" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(endEmploymentMock).toHaveBeenCalledWith("emp-1", "2026-10-24");
    for (const queryKey of [
      qk.employments("org-1"),
      qk.organization("org-1"),
      ["group-users"],
      ["attendance-team"],
      ["vacations"],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    }
  });
});

describe("useRemoveGroupUser", () => {
  it("refreshes bookings too, since the removal cancels the future ones", async () => {
    removeGroupUserMock.mockResolvedValue({});
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRemoveGroupUser(), { wrapper: wrapperFor(client) });

    result.current.mutate({ groupId: "g-1", userId: "u-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.groupUsers("g-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vacations"] });
  });
});
