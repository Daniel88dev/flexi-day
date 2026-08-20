import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { listBankHolidayCountries, listBankHolidays } from "../bank-holidays";

describe("bank holidays api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue([]);
  });

  it("listBankHolidays GETs with country and year", async () => {
    await listBankHolidays({ country: "CZ", year: 2026 });
    expect(apiMock).toHaveBeenCalledWith("/api/bank-holidays?country=CZ&year=2026");
  });

  it("listBankHolidayCountries GETs the country list", async () => {
    await listBankHolidayCountries();
    expect(apiMock).toHaveBeenCalledWith("/api/bank-holidays/countries");
  });
});
