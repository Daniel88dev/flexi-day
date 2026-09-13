import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import type { AttendanceExclusion } from "@/lib/api/attendance";
import { exclusionLabel } from "../exclusion";

const exclusion = (overrides: Partial<AttendanceExclusion> = {}): AttendanceExclusion => ({
  cause: "NON_WORKING_DAY",
  extent: "FULL",
  label: null,
  ...overrides,
});

describe("exclusionLabel", () => {
  it("names a day of the week nobody works", () => {
    expect(exclusionLabel(en, exclusion())).toBe("Non-working day");
  });

  it("prefers the holiday's own name to the word holiday", () => {
    expect(exclusionLabel(en, exclusion({ cause: "HOLIDAY", label: "St Wenceslas Day" }))).toBe(
      "St Wenceslas Day"
    );
  });

  it("falls back to the cause for a holiday that came without a name", () => {
    expect(exclusionLabel(en, exclusion({ cause: "HOLIDAY" }))).toBe("Public holiday");
  });

  it("reads an absence as the type that was booked", () => {
    expect(exclusionLabel(en, exclusion({ cause: "ABSENCE", label: "SICK_DAY" }))).toBe("Sick day");
  });

  it("keeps an unknown record type rather than crashing on it", () => {
    expect(exclusionLabel(en, exclusion({ cause: "ABSENCE", label: "SABBATICAL" }))).toBe(
      "SABBATICAL"
    );
  });

  it("says a date was nobody's to work", () => {
    expect(exclusionLabel(en, exclusion({ cause: "NOT_EMPLOYED" }))).toBe("Not employed");
  });

  it("marks half a day as half of one", () => {
    expect(
      exclusionLabel(en, exclusion({ cause: "ABSENCE", label: "VACATION", extent: "HALF" }))
    ).toBe("Vacation ½");
  });
});
