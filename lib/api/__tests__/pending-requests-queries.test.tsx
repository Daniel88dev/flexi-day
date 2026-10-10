import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { CalendarRecordType, type PendingApproval } from "../types";

const listMyPendingRequestsMock = vi.fn();
vi.mock("../approvals", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../approvals")>()),
  listMyPendingRequests: () => listMyPendingRequestsMock(),
}));

const vacationMocks = {
  createVacation: vi.fn(),
  cancelVacations: vi.fn(),
  approveVacations: vi.fn(),
  rejectVacations: vi.fn(),
};
vi.mock("../vacations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../vacations")>()),
  createVacation: (...args: unknown[]) => vacationMocks.createVacation(...args),
  cancelVacations: (...args: unknown[]) => vacationMocks.cancelVacations(...args),
  approveVacations: (...args: unknown[]) => vacationMocks.approveVacations(...args),
  rejectVacations: (...args: unknown[]) => vacationMocks.rejectVacations(...args),
}));

import {
  qk,
  useApproveVacations,
  useCancelVacations,
  useCreateVacation,
  useMyPendingRequests,
  useRejectVacations,
} from "../queries";

const pending: PendingApproval = {
  vacationIds: ["v-1"],
  user: { id: "u-1", name: "Alice", initials: "A", avatarColor: "hsl(10 60% 60%)" },
  groupId: "g-1",
  groupName: "Product",
  vacationType: CalendarRecordType.Vacation,
  from: "2026-11-30",
  to: "2026-11-30",
  businessDays: 1,
  note: null,
  submittedAt: "2026-10-10T10:00:00.000Z",
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("useMyPendingRequests", () => {
  beforeEach(() => listMyPendingRequestsMock.mockReset());

  it("returns the caller's requests still waiting on an Approver", async () => {
    listMyPendingRequestsMock.mockResolvedValue([pending]);
    const { wrapper } = makeClient();
    const { result } = renderHook(() => useMyPendingRequests(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([pending]);
  });
});

describe("vacation mutations refresh the caller's pending requests", () => {
  beforeEach(() => {
    for (const mock of Object.values(vacationMocks)) {
      mock.mockReset();
      mock.mockResolvedValue({});
    }
  });

  const cases = [
    { name: "creating", hook: useCreateVacation, input: {} },
    { name: "cancelling", hook: useCancelVacations, input: { ids: ["v-1"] } },
    { name: "approving", hook: useApproveVacations, input: ["v-1"] },
    { name: "rejecting", hook: useRejectVacations, input: { ids: ["v-1"] } },
  ] as const;

  for (const { name, hook, input } of cases) {
    it(`invalidates the pending requests after ${name} a request`, async () => {
      const { client, wrapper } = makeClient();
      const invalidate = vi.spyOn(client, "invalidateQueries");
      const { result } = renderHook(() => hook(), { wrapper });

      (result.current.mutate as (arg: unknown) => void)(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.myPendingRequests() });
    });
  }
});
