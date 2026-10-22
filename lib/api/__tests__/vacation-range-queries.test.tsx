import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listVacationsMock = vi.fn();
vi.mock("../vacations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../vacations")>()),
  listVacations: (...args: unknown[]) => listVacationsMock(...args),
}));

import { qk, useVacationRange } from "../queries";

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const params = {
  from: "2026-11-01",
  to: "2027-02-01",
  groupId: "g-1",
  includeCancelled: true,
  wholeRequests: true,
};

describe("useVacationRange", () => {
  beforeEach(() => {
    listVacationsMock.mockReset().mockResolvedValue([{ id: "range" }]);
  });

  it("lists the whole range in one call", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useVacationRange(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listVacationsMock).toHaveBeenCalledTimes(1);
    expect(listVacationsMock).toHaveBeenCalledWith(params);
    expect(result.current.data).toEqual([{ id: "range" }]);
  });

  it("is refreshed by the same invalidation as every other vacation view", () => {
    const { client } = setup();
    const key = qk.vacationRange(params);
    client.setQueryData(key, []);

    void client.invalidateQueries({ queryKey: ["vacations"] });

    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  });
});
