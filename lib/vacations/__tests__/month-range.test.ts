import { describe, it, expect } from "vitest";
import {
  customMonths,
  presetRange,
  rangeLabel,
  rangeQuery,
  withFirst,
  withLast,
} from "../month-range";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

describe("rangeLabel", () => {
  it("names a single month with its year", () => {
    const oct = { year: 2026, month: 10 };
    expect(rangeLabel({ first: oct, last: oct }, MONTHS)).toBe("Oct 2026");
  });

  it("names the year once for months within one year", () => {
    const range = { first: { year: 2026, month: 10 }, last: { year: 2026, month: 12 } };
    expect(rangeLabel(range, MONTHS)).toBe("Oct – Dec 2026");
  });

  it("names both years for a range across a year boundary", () => {
    const range = { first: { year: 2026, month: 11 }, last: { year: 2027, month: 1 } };
    expect(rangeLabel(range, MONTHS)).toBe("Nov 2026 – Jan 2027");
  });
});

describe("rangeQuery", () => {
  it("returns the 1st of the first month and the 1st of the month after the last", () => {
    const range = { first: { year: 2026, month: 3 }, last: { year: 2026, month: 5 } };
    expect(rangeQuery(range)).toEqual({ from: "2026-03-01", to: "2026-06-01" });
  });

  it("rolls `to` into the next year when the range ends in December", () => {
    const range = { first: { year: 2026, month: 11 }, last: { year: 2026, month: 12 } };
    expect(rangeQuery(range)).toEqual({ from: "2026-11-01", to: "2027-01-01" });
  });

  it("spans a year boundary in one range", () => {
    const range = { first: { year: 2026, month: 11 }, last: { year: 2027, month: 1 } };
    expect(rangeQuery(range)).toEqual({ from: "2026-11-01", to: "2027-02-01" });
  });
});

describe("presetRange", () => {
  const today = { year: 2026, month: 10 };

  it("returns the current month for `this`", () => {
    expect(presetRange("this", today)).toEqual({ first: today, last: today });
  });

  it("returns the current month plus the next two for `next3`", () => {
    expect(presetRange("next3", today)).toEqual({ first: today, last: { year: 2026, month: 12 } });
  });

  it("carries `next3` into the next year from November", () => {
    expect(presetRange("next3", { year: 2026, month: 11 })).toEqual({
      first: { year: 2026, month: 11 },
      last: { year: 2027, month: 1 },
    });
  });

  it("returns January to December of the current year for `year`", () => {
    expect(presetRange("year", today)).toEqual({
      first: { year: 2026, month: 1 },
      last: { year: 2026, month: 12 },
    });
  });
});

describe("withFirst", () => {
  const octToDec = { first: { year: 2026, month: 10 }, last: { year: 2026, month: 12 } };

  it("moves only the start when it stays before the end", () => {
    expect(withFirst(octToDec, { year: 2026, month: 8 })).toEqual({
      first: { year: 2026, month: 8 },
      last: { year: 2026, month: 12 },
    });
  });

  it("pulls the end along when the start lands after it", () => {
    const feb = { year: 2027, month: 2 };
    expect(withFirst(octToDec, feb)).toEqual({ first: feb, last: feb });
  });
});

describe("withLast", () => {
  const octToDec = { first: { year: 2026, month: 10 }, last: { year: 2026, month: 12 } };

  it("moves only the end when it stays after the start", () => {
    expect(withLast(octToDec, { year: 2027, month: 1 })).toEqual({
      first: { year: 2026, month: 10 },
      last: { year: 2027, month: 1 },
    });
  });

  it("pulls the start along when the end lands before it", () => {
    const may = { year: 2026, month: 5 };
    expect(withLast(octToDec, may)).toEqual({ first: may, last: may });
  });
});

describe("customMonths", () => {
  it("lists January last year through December next year", () => {
    const months = customMonths({ year: 2026, month: 10 });
    expect(months).toHaveLength(36);
    expect(months[0]).toEqual({ year: 2025, month: 1 });
    expect(months[35]).toEqual({ year: 2027, month: 12 });
  });
});
