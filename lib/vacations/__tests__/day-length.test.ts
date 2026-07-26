import { describe, it, expect } from "vitest";
import { dayLengthLabel } from "../day-length";

const labels = { halfDay: "Half day", fullDay: "Full day" };

describe("dayLengthLabel", () => {
  it("returns the full-day label when nothing narrows the day", () => {
    expect(dayLengthLabel({ halfDay: false, startTime: null, endTime: null }, labels)).toBe(
      "Full day"
    );
  });

  it("returns the half-day label from the flag alone", () => {
    expect(dayLengthLabel({ halfDay: true, startTime: null, endTime: null }, labels)).toBe(
      "Half day"
    );
  });

  it("does not infer a half day from times being set", () => {
    expect(
      dayLengthLabel({ halfDay: false, startTime: "08:00:00", endTime: "12:00:00" }, labels)
    ).toBe("08:00 – 12:00");
  });

  it("shows the half-day label alongside times when both are present", () => {
    expect(
      dayLengthLabel({ halfDay: true, startTime: "13:00:00", endTime: "17:00:00" }, labels)
    ).toBe("Half day · 13:00 – 17:00");
  });

  it("ignores a half-open time range", () => {
    expect(dayLengthLabel({ halfDay: false, startTime: "09:00:00", endTime: null }, labels)).toBe(
      "Full day"
    );
  });
});
