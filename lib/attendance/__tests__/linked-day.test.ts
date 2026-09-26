import { describe, expect, it } from "vitest";
import { linkedDay } from "../linked-day";

const TODAY = "2026-09-11";

describe("linkedDay", () => {
  it("returns the linked date when it is an earlier day", () => {
    expect(linkedDay("2026-09-03", TODAY)).toBe("2026-09-03");
  });

  it("returns today when there is no date", () => {
    expect(linkedDay(null, TODAY)).toBe(TODAY);
  });

  it("returns today itself when linked to today", () => {
    expect(linkedDay(TODAY, TODAY)).toBe(TODAY);
  });

  it("returns today when the date is still to come", () => {
    expect(linkedDay("2026-09-12", TODAY)).toBe(TODAY);
    expect(linkedDay("2027-01-01", TODAY)).toBe(TODAY);
  });

  it.each([
    "",
    "yesterday",
    "2026-9-3",
    "2026-09-03T10:00",
    " 2026-09-03",
    "20260903",
    "2026/09/03",
  ])("returns today for the malformed date %j", (param) => {
    expect(linkedDay(param, TODAY)).toBe(TODAY);
  });

  it.each(["2026-02-30", "2026-02-29", "2026-13-01", "2026-00-10", "2026-04-31", "2026-09-00"])(
    "returns today for the impossible date %s",
    (param) => {
      expect(linkedDay(param, TODAY)).toBe(TODAY);
    }
  );

  it("returns a leap day in a leap year", () => {
    expect(linkedDay("2024-02-29", TODAY)).toBe("2024-02-29");
  });
});
