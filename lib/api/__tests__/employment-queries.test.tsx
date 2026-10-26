import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const endEmploymentMock = vi.fn();
const eraseEmploymentMock = vi.fn();
const updateGroupManagerMock = vi.fn();
const removeGroupUserMock = vi.fn();
vi.mock("../employment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../employment")>()),
  endEmployment: (...args: unknown[]) => endEmploymentMock(...args),
  eraseEmployment: (...args: unknown[]) => eraseEmploymentMock(...args),
}));
vi.mock("../groups", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../groups")>()),
  updateGroupManager: (...args: unknown[]) => updateGroupManagerMock(...args),
}));
vi.mock("../group-users", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../group-users")>()),
  removeGroupUser: (...args: unknown[]) => removeGroupUserMock(...args),
}));

import {
  qk,
  useEndEmployment,
  useEraseEmployment,
  useRemoveGroupUser,
  useUpdateGroupManager,
} from "../queries";

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
      ["directory"],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    }
  });

  it("drops the End preview, which an ended record no longer answers", async () => {
    endEmploymentMock.mockResolvedValue({ id: "emp-1", ended: true, cancelledBookings: 0 });
    const client = newClient();
    client.setQueryData(qk.directoryEndPreview("org-1", "emp-1"), { employmentId: "emp-1" });
    const { result } = renderHook(() => useEndEmployment("org-1"), {
      wrapper: wrapperFor(client),
    });

    result.current.mutate({ employmentId: "emp-1", endedOn: "2026-10-24" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(qk.directoryEndPreview("org-1", "emp-1"))).toBeUndefined();
  });
});

describe("useEraseEmployment", () => {
  it("refreshes the roster, the exports, member lists, Team attendance and bookings once it erases", async () => {
    eraseEmploymentMock.mockResolvedValue(undefined);
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useEraseEmployment("org-1"), {
      wrapper: wrapperFor(client),
    });

    result.current.mutate({ employmentId: "emp-1", confirmName: "Jana Nováková" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eraseEmploymentMock).toHaveBeenCalledWith("emp-1", "Jana Nováková");
    for (const queryKey of [
      qk.employments("org-1"),
      qk.organization("org-1"),
      qk.requestedExports("org-1"),
      qk.organizationExport("org-1"),
      ["group-users"],
      ["attendance-team"],
      ["vacations"],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    }
  });
});

describe("useUpdateGroupManager", () => {
  it("refreshes the groups, the group, its members and the organization once the manager changes", async () => {
    updateGroupManagerMock.mockResolvedValue({ id: "g-1" });
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateGroupManager(), { wrapper: wrapperFor(client) });

    result.current.mutate({ groupId: "g-1", managerUserId: "u-2" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateGroupManagerMock).toHaveBeenCalledWith({ groupId: "g-1", managerUserId: "u-2" });
    for (const queryKey of [qk.groups(), qk.group("g-1"), qk.groupUsers("g-1"), ["organization"]]) {
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
