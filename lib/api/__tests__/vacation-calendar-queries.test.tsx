import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listVacationCalendarMock = vi.fn();
const listVacationsMock = vi.fn();
vi.mock("../vacations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../vacations")>()),
  listVacationCalendar: (...args: unknown[]) => listVacationCalendarMock(...args),
  listVacations: (...args: unknown[]) => listVacationsMock(...args),
}));

import { qk, useVacationCalendar, useVacations } from "../queries";

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("useVacationCalendar", () => {
  beforeEach(() => {
    listVacationCalendarMock.mockReset().mockResolvedValue([{ id: "padded" }]);
    listVacationsMock.mockReset().mockResolvedValue([{ id: "month" }]);
  });

  it("reads the dashboard calendar route for the month and group", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useVacationCalendar({ year: 2026, month: 12, groupId: "g-1" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listVacationCalendarMock).toHaveBeenCalledWith({
      year: 2026,
      month: 12,
      groupId: "g-1",
    });
    expect(result.current.data).toEqual([{ id: "padded" }]);
  });

  it("never shares a cache entry with the month list", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => ({
        calendar: useVacationCalendar({ year: 2026, month: 12, groupId: null }),
        month: useVacations({ year: 2026, month: 12, groupId: null }),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.month.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.calendar.isSuccess).toBe(true));
    expect(result.current.calendar.data).toEqual([{ id: "padded" }]);
    expect(result.current.month.data).toEqual([{ id: "month" }]);
  });

  it("is refreshed by the same invalidation as every other vacation view", () => {
    const { client } = setup();
    client.setQueryData(qk.vacationCalendar(2026, 12, null), []);

    void client.invalidateQueries({ queryKey: ["vacations"] });

    expect(client.getQueryState(qk.vacationCalendar(2026, 12, null))?.isInvalidated).toBe(true);
  });
});
