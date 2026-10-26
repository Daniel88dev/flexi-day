import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatDay } from "../format";

describe("formatDay", () => {
  it("returns the calendar day a YYYY-MM-DD names, whatever the zone", () => {
    expect(formatDay("2026-03-01", "en-GB")).toBe("01/03/2026");
    expect(formatDay("2026-03-01", "cs-CZ")).toBe("1. 3. 2026");
  });
});

describe("formatDate", () => {
  it("returns the date of a timestamp in the locale", () => {
    const value = "2026-03-01T12:00:00.000Z";
    expect(formatDate(value, "en-GB")).toBe(new Date(value).toLocaleDateString("en-GB"));
  });
});

describe("formatDateTime", () => {
  it("returns a short date and time", () => {
    const value = "2026-03-01T12:00:00.000Z";
    expect(formatDateTime(value, "en-GB")).toBe(
      new Date(value).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })
    );
  });
});
