import { describe, expect, it } from "vitest";
import type { AttendanceSession } from "@/lib/api/attendance";
import { NO_SESSION_LOCATION } from "@/lib/test-utils";
import {
  anySessionLocated,
  formatAccuracy,
  formatCoordinates,
  hasLocation,
  locationOf,
} from "../location";

const session = (overrides: Partial<AttendanceSession> = {}): AttendanceSession => ({
  id: "session-1",
  businessDate: "2026-09-11",
  startedAt: "2026-09-11T06:00:00Z",
  endedAt: "2026-09-11T14:00:00Z",
  timezone: "Europe/Prague",
  closedBy: "USER",
  open: false,
  ...NO_SESSION_LOCATION,
  breaks: [],
  ...overrides,
});

const LOCATED = {
  startLatitude: 50.075538,
  startLongitude: 14.437801,
  startAccuracy: 12.4,
  endLatitude: 50.09,
  endLongitude: 14.45,
  endAccuracy: 30,
};

describe("locationOf", () => {
  it("returns the clock-in columns for IN", () => {
    expect(locationOf(session(LOCATED), "IN")).toEqual({
      latitude: 50.075538,
      longitude: 14.437801,
      accuracy: 12.4,
    });
  });

  it("returns the clock-out columns for OUT", () => {
    expect(locationOf(session(LOCATED), "OUT")).toEqual({
      latitude: 50.09,
      longitude: 14.45,
      accuracy: 30,
    });
  });

  it("returns nulls where nothing was recorded", () => {
    expect(locationOf(session(), "IN")).toEqual({
      latitude: null,
      longitude: null,
      accuracy: null,
    });
  });
});

describe("hasLocation", () => {
  it("is true only once both coordinates are there", () => {
    expect(hasLocation({ latitude: 50, longitude: 14, accuracy: null })).toBe(true);
    expect(hasLocation({ latitude: 50, longitude: null, accuracy: 10 })).toBe(false);
    expect(hasLocation({ latitude: null, longitude: null, accuracy: null })).toBe(false);
  });
});

describe("anySessionLocated", () => {
  it("is false for a day nobody's browser answered for", () => {
    expect(anySessionLocated([session(), session()])).toBe(false);
  });

  it("is true when even one end of one session carries a fix", () => {
    expect(anySessionLocated([session(), session({ endLatitude: 50, endLongitude: 14 })])).toBe(
      true
    );
  });

  it("is false for an empty day", () => {
    expect(anySessionLocated([])).toBe(false);
  });
});

describe("formatCoordinates", () => {
  it("rounds to four decimals", () => {
    expect(formatCoordinates({ latitude: 50.075538, longitude: 14.437801, accuracy: 12 })).toBe(
      "50.0755, 14.4378"
    );
  });

  it("keeps the trailing zeros so the columns line up", () => {
    expect(formatCoordinates({ latitude: 50, longitude: -0.5, accuracy: null })).toBe(
      "50.0000, -0.5000"
    );
  });

  it("returns null when there is nothing to show", () => {
    expect(formatCoordinates({ latitude: null, longitude: 14, accuracy: 5 })).toBeNull();
    expect(formatCoordinates({ latitude: Number.NaN, longitude: 14, accuracy: 5 })).toBeNull();
  });
});

describe("formatAccuracy", () => {
  it("rounds to the metre", () => {
    expect(formatAccuracy(12.4)).toBe(12);
    expect(formatAccuracy(12.6)).toBe(13);
  });

  it("never reads as zero metres", () => {
    expect(formatAccuracy(0.2)).toBe(1);
  });

  it("returns null for nothing measurable", () => {
    expect(formatAccuracy(null)).toBeNull();
    expect(formatAccuracy(0)).toBeNull();
    expect(formatAccuracy(Number.NaN)).toBeNull();
  });
});
