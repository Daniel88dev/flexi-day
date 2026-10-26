import { describe, expect, it } from "vitest";
import { isShortening } from "@/lib/directory/retention";

describe("isShortening", () => {
  it("returns true only for a move to an earlier period", () => {
    expect(isShortening("YEARS_3", "DAYS_30")).toBe(true);
    expect(isShortening("UNTIL_ERASED", "YEARS_10")).toBe(true);
    expect(isShortening("DAYS_30", "AT_END")).toBe(true);
    expect(isShortening("DAYS_30", "DAYS_30")).toBe(false);
    expect(isShortening("YEAR_1", "UNTIL_ERASED")).toBe(false);
  });
});
