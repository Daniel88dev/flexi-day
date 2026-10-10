import { describe, expect, it } from "vitest";
import {
  bookedDayCount,
  datesCovered,
  formatDragRange,
  normalizeRange,
  rangeCellFill,
  workingDayCount,
} from "../drag-range";

describe("normalizeRange", () => {
  it("returns the range as is when dragged forward", () => {
    expect(normalizeRange("2026-10-07", "2026-10-15")).toEqual({
      from: "2026-10-07",
      to: "2026-10-15",
    });
  });

  it("returns the same range when dragged backward", () => {
    expect(normalizeRange("2026-10-15", "2026-10-07")).toEqual({
      from: "2026-10-07",
      to: "2026-10-15",
    });
  });
});

describe("workingDayCount", () => {
  it("counts Monday to Friday and skips the weekend", () => {
    // 7 Oct 2026 is a Wednesday; 15 Oct a Thursday.
    expect(workingDayCount({ from: "2026-10-07", to: "2026-10-15" }, new Set())).toBe(7);
  });

  it("skips holidays that fall on a weekday", () => {
    // 28 Sep 2026 (Monday) is a Czech holiday.
    expect(workingDayCount({ from: "2026-09-28", to: "2026-10-02" }, new Set(["2026-09-28"]))).toBe(
      4
    );
  });

  it("does not count a holiday on a weekend twice", () => {
    expect(workingDayCount({ from: "2026-10-09", to: "2026-10-12" }, new Set(["2026-10-10"]))).toBe(
      2
    );
  });

  it("returns zero for a range of weekend days only", () => {
    expect(workingDayCount({ from: "2026-10-10", to: "2026-10-11" }, new Set())).toBe(0);
  });

  it("counts across a month boundary", () => {
    expect(workingDayCount({ from: "2026-09-30", to: "2026-10-01" }, new Set())).toBe(2);
  });
});

describe("bookedDayCount", () => {
  const booked = new Set(["2026-10-14", "2026-10-15", "2026-10-20"]);

  it("counts the booked days inside the range, weekends included", () => {
    expect(bookedDayCount({ from: "2026-10-07", to: "2026-10-15" }, booked)).toBe(2);
  });

  it("returns zero when nothing in the range is booked", () => {
    expect(bookedDayCount({ from: "2026-10-01", to: "2026-10-13" }, booked)).toBe(0);
  });

  it("counts a single booked day", () => {
    expect(bookedDayCount({ from: "2026-10-20", to: "2026-10-20" }, booked)).toBe(1);
  });
});

describe("rangeCellFill", () => {
  const range = { from: "2026-10-07", to: "2026-10-15" };
  const booked = new Set(["2026-10-14"]);

  it("washes a day inside the range with the primary mix", () => {
    expect(rangeCellFill("2026-10-07", range, booked)).toBe(
      "color-mix(in oklch, var(--primary) 17%, var(--surface))"
    );
  });

  it("fills a booked day inside the range red instead", () => {
    expect(rangeCellFill("2026-10-14", range, booked)).toBe(
      "color-mix(in oklch, var(--destructive) 20%, var(--surface))"
    );
  });

  it("leaves days outside the range alone, booked or not", () => {
    expect(rangeCellFill("2026-10-16", range, booked)).toBeUndefined();
    expect(rangeCellFill("2026-10-06", range, new Set(["2026-10-06"]))).toBeUndefined();
  });

  it("leaves every day alone when there is no range", () => {
    expect(rangeCellFill("2026-10-07", null, booked)).toBeUndefined();
  });
});

describe("formatDragRange", () => {
  it("formats a range within one month in English", () => {
    expect(formatDragRange({ from: "2026-10-07", to: "2026-10-15" }, "en-GB")).toMatch(
      /^7\s–\s15 Oct$/
    );
  });

  it("names both months when the range crosses one", () => {
    expect(formatDragRange({ from: "2026-09-28", to: "2026-10-03" }, "en-GB")).toMatch(
      /^28 Sept?\s–\s3 Oct$/
    );
  });

  it("formats a single day once", () => {
    expect(formatDragRange({ from: "2026-10-07", to: "2026-10-07" }, "en-GB")).toBe("7 Oct");
  });

  it("follows the Czech locale", () => {
    expect(formatDragRange({ from: "2026-10-07", to: "2026-10-15" }, "cs-CZ")).toMatch(
      /^7\.\s10\.\s–\s15\.\s10\.$/
    );
  });
});

describe("datesCovered", () => {
  it("returns every day of every range, once", () => {
    expect(
      [
        ...datesCovered([
          { from: "2026-09-30", to: "2026-10-02" },
          { from: "2026-10-02", to: "2026-10-03" },
        ]),
      ].sort()
    ).toEqual(["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]);
  });

  it("returns an empty set for no ranges", () => {
    expect(datesCovered([]).size).toBe(0);
  });
});
