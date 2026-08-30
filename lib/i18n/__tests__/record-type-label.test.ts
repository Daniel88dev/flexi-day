import { describe, expect, it } from "vitest";
import { recordTypeLabel } from "../record-type-label";
import { en } from "../dictionaries/en";
import { CalendarRecordType } from "@/lib/api/types";

describe("recordTypeLabel", () => {
  it("returns the dictionary label for a known type", () => {
    expect(recordTypeLabel(en.calendarRecordTypes, CalendarRecordType.StudyLeave)).toBe(
      "Study Leave"
    );
  });

  it("falls back to the raw value for a type from a newer backend", () => {
    expect(recordTypeLabel(en.calendarRecordTypes, "SABBATICAL" as CalendarRecordType)).toBe(
      "SABBATICAL"
    );
  });
});
