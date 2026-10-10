import { describe, expect, it } from "vitest";
import {
  formatIsoDate,
  gridRange,
  gridYears,
  isoDate,
  monthLabelDates,
  monthWeeks,
  seamColumn,
  weekSpan,
  weeksCovering,
} from "../month-grid";

const dates = (week: { date: string }[]) => week.map((d) => d.date);

describe("monthWeeks", () => {
  it("returns Monday-first weeks for a month that starts on a Monday", () => {
    const weeks = monthWeeks(2026, 6);

    expect(weeks).toHaveLength(5);
    expect(dates(weeks[0])).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-06",
      "2026-06-07",
    ]);
    expect(weeks[0].every((d) => d.inMonth)).toBe(true);
    expect(dates(weeks[4])).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
    ]);
    expect(weeks[4].map((d) => d.inMonth)).toEqual([true, true, false, false, false, false, false]);
  });

  it("pads a month that starts on a Sunday with the six days before it", () => {
    const weeks = monthWeeks(2026, 11);

    expect(dates(weeks[0])).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(weeks[0].map((d) => d.inMonth)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
    expect(weeks[0].map((d) => d.day)).toEqual([26, 27, 28, 29, 30, 31, 1]);
    expect(weeks).toHaveLength(6);
    expect(dates(weeks[5])[0]).toBe("2026-11-30");
    expect(weeks[5].at(-1)?.date).toBe("2026-12-06");
  });

  it("fits a non-leap February that starts on a Monday into exactly four weeks", () => {
    const weeks = monthWeeks(2027, 2);

    expect(weeks).toHaveLength(4);
    expect(weeks[0][0].date).toBe("2027-02-01");
    expect(weeks[3][6].date).toBe("2027-02-28");
    expect(weeks.flat().every((d) => d.inMonth)).toBe(true);
  });

  it("ends a non-leap February on the 28th and pads into March", () => {
    const weeks = monthWeeks(2026, 2);
    const inMonth = weeks.flat().filter((d) => d.inMonth);

    expect(inMonth).toHaveLength(28);
    expect(inMonth.at(-1)?.date).toBe("2026-02-28");
    expect(dates(weeks.at(-1) ?? [])).toEqual([
      "2026-02-23",
      "2026-02-24",
      "2026-02-25",
      "2026-02-26",
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
    ]);
  });

  it("crosses the year boundary in its padding", () => {
    const weeks = monthWeeks(2027, 1);

    expect(dates(weeks[0]).slice(0, 4)).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
    ]);
    expect(weeks[0][4]).toEqual({ date: "2027-01-01", day: 1, inMonth: true });
  });

  it("returns seven days in every week", () => {
    for (let month = 1; month <= 12; month++) {
      expect(monthWeeks(2026, month).every((w) => w.length === 7)).toBe(true);
    }
  });
});

describe("weekSpan", () => {
  // November 2026: the first week runs Monday 26 October to Sunday 1 November.
  const [first, second] = monthWeeks(2026, 11);

  it("places a range inside one week by its dates", () => {
    expect(weekSpan(second, "2026-11-03", "2026-11-05")).toEqual({
      startCol: 1,
      endCol: 4,
      continuesLeft: false,
      continuesRight: false,
    });
  });

  it("clips a range that runs on past the week and flags the continuation", () => {
    expect(weekSpan(first, "2026-11-01", "2026-11-03")).toEqual({
      startCol: 6,
      endCol: 7,
      continuesLeft: false,
      continuesRight: true,
    });
    expect(weekSpan(second, "2026-11-01", "2026-11-03")).toEqual({
      startCol: 0,
      endCol: 2,
      continuesLeft: true,
      continuesRight: false,
    });
  });

  it("places a range on padding days by their real dates", () => {
    expect(weekSpan(first, "2026-10-30", "2026-11-01")).toEqual({
      startCol: 4,
      endCol: 7,
      continuesLeft: false,
      continuesRight: false,
    });
  });

  it("returns null for a range outside the week", () => {
    expect(weekSpan(second, "2026-11-10", "2026-11-12")).toBeNull();
    expect(weekSpan(second, "2026-10-26", "2026-11-01")).toBeNull();
  });
});

describe("isoDate", () => {
  it("pads the month and day", () => {
    expect(isoDate(2026, 3, 5)).toBe("2026-03-05");
  });

  it("rolls day zero back to the last day of the previous month", () => {
    expect(isoDate(2026, 3, 0)).toBe("2026-02-28");
    expect(isoDate(2028, 3, 0)).toBe("2028-02-29");
  });
});

describe("weeksCovering", () => {
  it("widens an arbitrary range out to whole Monday-first weeks", () => {
    // Thursday 29 October to Tuesday 3 November 2026.
    expect(weeksCovering("2026-10-29", "2026-11-03")).toEqual([
      [
        "2026-10-26",
        "2026-10-27",
        "2026-10-28",
        "2026-10-29",
        "2026-10-30",
        "2026-10-31",
        "2026-11-01",
      ],
      [
        "2026-11-02",
        "2026-11-03",
        "2026-11-04",
        "2026-11-05",
        "2026-11-06",
        "2026-11-07",
        "2026-11-08",
      ],
    ]);
  });
});

describe("gridRange", () => {
  it("returns the first and last date the month grid shows", () => {
    // November 2026 opens on a Sunday and closes on a Monday.
    expect(gridRange(2026, 11)).toEqual({ from: "2026-10-26", to: "2026-12-06" });
  });

  it("returns the month itself when it fills whole weeks", () => {
    // February 2027 runs Monday 1 to Sunday 28.
    expect(gridRange(2027, 2)).toEqual({ from: "2027-02-01", to: "2027-02-28" });
  });
});

describe("gridYears", () => {
  it("returns only the month's year when the grid stays inside it", () => {
    expect(gridYears(2026, 7)).toEqual([2026]);
  });

  it("adds the previous year when January's grid opens in December", () => {
    // 1 January 2027 is a Friday, so the grid starts on 28 December 2026.
    expect(gridYears(2027, 1)).toEqual([2026, 2027]);
  });

  it("adds the next year when December's grid closes in January", () => {
    // 31 December 2026 is a Thursday, so the grid runs to 3 January 2027.
    expect(gridYears(2026, 12)).toEqual([2026, 2027]);
  });

  it("stays in one year when January opens on a Monday", () => {
    // 1 January 2029 is a Monday.
    expect(gridYears(2029, 1)).toEqual([2029]);
  });
});

describe("seamColumn", () => {
  it("returns the column of the cell that opens a month mid-week", () => {
    // 1 October 2026 is a Thursday.
    expect(seamColumn(monthWeeks(2026, 10)[0])).toBe(3);
  });

  it("returns the column where the next month opens in the last week", () => {
    // 1 December 2026 is a Tuesday, in November's last week.
    const weeks = monthWeeks(2026, 11);
    expect(seamColumn(weeks[weeks.length - 1])).toBe(1);
  });

  it("returns null when the month changes on a Monday", () => {
    // June 2026 opens on a Monday; July opens on a Wednesday in June's last week.
    expect(seamColumn(monthWeeks(2026, 6)[0])).toBeNull();
  });

  it("returns null for a week inside the month", () => {
    expect(seamColumn(monthWeeks(2026, 10)[2])).toBeNull();
  });
});

describe("monthLabelDates", () => {
  it("labels the grid's first cell and the first day of the next month", () => {
    expect([...monthLabelDates(monthWeeks(2026, 11))].sort()).toEqual(["2026-10-26", "2026-12-01"]);
  });

  it("labels nothing on the leading side when the month opens on a Monday", () => {
    // June 2026: Monday 1 June, last week runs into Sunday 5 July.
    expect([...monthLabelDates(monthWeeks(2026, 6))]).toEqual(["2026-07-01"]);
  });

  it("labels nothing when the month fills whole weeks", () => {
    expect(monthLabelDates(monthWeeks(2027, 2)).size).toBe(0);
  });
});

describe("formatIsoDate", () => {
  it("formats the calendar date in the given locale, whatever the time zone", () => {
    expect(formatIsoDate("2026-09-28", "en-GB", { day: "numeric", month: "long" })).toBe(
      "28 September"
    );
    expect(formatIsoDate("2026-12-01", "cs-CZ", { day: "numeric", month: "long" })).toBe(
      "1. prosince"
    );
  });
});
