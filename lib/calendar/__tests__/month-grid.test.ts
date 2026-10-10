import { describe, expect, it } from "vitest";
import { isoDate, monthWeeks, weekSpan, weeksCovering } from "../month-grid";

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
