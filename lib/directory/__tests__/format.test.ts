import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatDay, formatEmploymentDay } from "../format";

describe("formatEmploymentDay", () => {
  it("returns the day the instant falls on in the organization's zone, not the viewer's", () => {
    const lastInstantOf30SepInUtc = "2026-09-30T23:59:59.999Z";
    expect(formatEmploymentDay(lastInstantOf30SepInUtc, "en-GB", "UTC")).toBe("30/09/2026");
    expect(formatEmploymentDay(lastInstantOf30SepInUtc, "en-GB", "Europe/Prague")).toBe(
      "01/10/2026"
    );
    expect(formatEmploymentDay(lastInstantOf30SepInUtc, "cs-CZ", "UTC")).toBe("30. 9. 2026");
  });

  it("returns the day in UTC when the zone is unknown", () => {
    expect(formatEmploymentDay("2026-10-01T02:00:00.000Z", "en-GB", undefined)).toBe("01/10/2026");
  });
});

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
