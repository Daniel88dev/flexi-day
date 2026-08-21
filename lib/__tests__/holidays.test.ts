import { describe, expect, it } from "vitest";
import { bankHolidaysToRanges } from "@/lib/holidays";
import { VacationKind, type BankHoliday } from "@/lib/api/types";

const holiday = (date: string, name: string, country = "CZ"): BankHoliday => ({
  date,
  name,
  country,
});

describe("bankHolidaysToRanges", () => {
  it("returns an empty list for no holidays", () => {
    expect(bankHolidaysToRanges([], 2026, 8)).toEqual([]);
  });

  it("maps a holiday in the visible month to a single-day bank range", () => {
    const ranges = bankHolidaysToRanges([holiday("2026-08-15", "Assumption Day")], 2026, 8);

    expect(ranges).toEqual([
      {
        id: "bh-2026-08-15",
        who: "all",
        type: VacationKind.BankHoliday,
        from: 15,
        to: 15,
        note: "Assumption Day",
        vacationIds: [],
      },
    ]);
  });

  it("drops holidays outside the visible month and year", () => {
    const ranges = bankHolidaysToRanges(
      [holiday("2026-07-06", "Jan Hus Day"), holiday("2025-08-15", "Assumption Day")],
      2026,
      8
    );

    expect(ranges).toEqual([]);
  });

  it("merges same-day holidays from different countries into one range", () => {
    const ranges = bankHolidaysToRanges(
      [
        holiday("2026-12-25", "Christmas Day", "CZ"),
        holiday("2026-12-25", "1. Weihnachtstag", "DE"),
      ],
      2026,
      12
    );

    expect(ranges).toHaveLength(1);
    expect(ranges[0]?.note).toBe("Christmas Day · 1. Weihnachtstag");
  });

  it("does not repeat an identical name shared by two countries", () => {
    const ranges = bankHolidaysToRanges(
      [
        holiday("2026-01-01", "New Year's Day", "DE"),
        holiday("2026-01-01", "New Year's Day", "AT"),
      ],
      2026,
      1
    );

    expect(ranges[0]?.note).toBe("New Year's Day");
  });

  it("sorts the ranges by day", () => {
    const ranges = bankHolidaysToRanges(
      [holiday("2026-12-26", "St. Stephen's Day"), holiday("2026-12-24", "Christmas Eve")],
      2026,
      12
    );

    expect(ranges.map((r) => r.from)).toEqual([24, 26]);
  });
});
