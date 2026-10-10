import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listBankHolidaysMock = vi.fn();
vi.mock("../bank-holidays", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../bank-holidays")>()),
  listBankHolidays: (...args: unknown[]) => listBankHolidaysMock(...args),
}));

import { useBankHolidaysMulti } from "../queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useBankHolidaysMulti", () => {
  beforeEach(() => {
    listBankHolidaysMock.mockReset();
    listBankHolidaysMock.mockImplementation(({ year, country }) =>
      Promise.resolve([{ date: `${year}-01-01`, name: `${country} ${year}`, country }])
    );
  });

  it("fetches every year for every country and merges the rows", async () => {
    const { result } = renderHook(() => useBankHolidaysMulti([2026, 2027], ["DE", "CZ", "CZ"]), {
      wrapper,
    });

    await waitFor(() => expect(result.current).toHaveLength(4));
    expect(listBankHolidaysMock.mock.calls.map(([p]) => `${p.year}-${p.country}`).sort()).toEqual([
      "2026-CZ",
      "2026-DE",
      "2027-CZ",
      "2027-DE",
    ]);
    expect(result.current.map((h) => h.name).sort()).toEqual([
      "CZ 2026",
      "CZ 2027",
      "DE 2026",
      "DE 2027",
    ]);
  });
});
