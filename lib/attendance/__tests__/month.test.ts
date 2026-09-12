import { describe, it, expect } from "vitest";
import type { AttendanceDay } from "@/lib/api/attendance";
import {
  addDays,
  addMonths,
  leadingBlanks,
  monthsOfWeek,
  pickDays,
  startOfWeek,
  weekDates,
  weekTotals,
  yearMonthOf,
} from "../month";

const day = (businessDate: string, overrides: Partial<AttendanceDay> = {}): AttendanceDay => ({
  businessDate,
  presenceMinutes: 510,
  breaksMinutes: 20,
  deductedMinutes: 30,
  workedMinutes: 480,
  requiredMinutes: 480,
  balanceMinutes: 0,
  upcoming: false,
  open: false,
  autoClosed: false,
  exclusion: null,
  excludedClockIn: false,
  flagged: false,
  sessions: [],
  ...overrides,
});

describe("addDays", () => {
  it("steps over a month boundary", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("steps over a spring-forward without losing the day", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
  });
});

describe("yearMonthOf and addMonths", () => {
  it("reads the month of a business date", () => {
    expect(yearMonthOf("2026-09-30")).toEqual({ year: 2026, month: 9 });
  });

  it("rolls over the year in both directions", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("startOfWeek", () => {
  it("returns the Monday of the week", () => {
    expect(startOfWeek("2026-09-11")).toBe("2026-09-07");
    expect(startOfWeek("2026-09-07")).toBe("2026-09-07");
  });

  it("puts Sunday at the end of its week, not the start", () => {
    expect(startOfWeek("2026-09-13")).toBe("2026-09-07");
  });
});

describe("weekDates", () => {
  it("runs Monday to Sunday", () => {
    expect(weekDates("2026-09-07")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
  });
});

describe("monthsOfWeek", () => {
  it("asks for one month when the week sits inside it", () => {
    expect(monthsOfWeek("2026-09-07")).toEqual([{ year: 2026, month: 9 }]);
  });

  it("asks for both when the week straddles a boundary", () => {
    expect(monthsOfWeek("2026-08-31")).toEqual([
      { year: 2026, month: 8 },
      { year: 2026, month: 9 },
    ]);
  });
});

describe("leadingBlanks", () => {
  it("counts the cells before a Tuesday the 1st", () => {
    expect(leadingBlanks({ year: 2026, month: 9 })).toBe(1);
  });

  it("gives a Sunday the 1st six, not none", () => {
    expect(leadingBlanks({ year: 2026, month: 11 })).toBe(6);
  });

  it("gives a Monday the 1st none", () => {
    expect(leadingBlanks({ year: 2026, month: 6 })).toBe(0);
  });
});

describe("weekTotals", () => {
  it("leaves the days still to come out of the required time", () => {
    const totals = weekTotals([
      day("2026-09-07"),
      day("2026-09-08", { workedMinutes: 240, balanceMinutes: -240, flagged: true }),
      day("2026-09-09", { workedMinutes: 0, presenceMinutes: 0, upcoming: true }),
    ]);

    expect(totals).toEqual({
      workedMinutes: 720,
      requiredMinutes: 960,
      balanceMinutes: -240,
      flaggedDays: 1,
    });
  });
});

describe("pickDays", () => {
  it("takes a week's days out of the two months it straddles", () => {
    const august = { days: [day("2026-08-31")] };
    const september = { days: [day("2026-09-01"), day("2026-09-02")] };

    expect(
      pickDays([august, september], ["2026-08-31", "2026-09-01", "2026-09-02"]).map(
        (entry) => entry.businessDate
      )
    ).toEqual(["2026-08-31", "2026-09-01", "2026-09-02"]);
  });

  it("skips a date no month has answered for yet", () => {
    expect(pickDays([{ days: [day("2026-09-01")] }], ["2026-08-31", "2026-09-01"])).toHaveLength(1);
  });
});
