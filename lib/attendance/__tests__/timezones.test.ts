import { afterEach, describe, expect, it, vi } from "vitest";
import { browserTimezone, listTimezones } from "../timezones";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("browserTimezone", () => {
  it("returns the zone the browser resolves to", () => {
    const zone = browserTimezone();
    expect(typeof zone).toBe("string");
    expect(zone).not.toBe("");
  });

  it("returns null when Intl cannot answer", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation((() => {
      throw new Error("no Intl");
    }) as unknown as typeof Intl.DateTimeFormat);

    expect(browserTimezone()).toBeNull();
  });
});

describe("listTimezones", () => {
  it("returns the IANA list the engine knows", () => {
    const zones = listTimezones();
    expect(zones.length).toBeGreaterThan(100);
    expect(zones).toContain("Europe/Prague");
  });

  it("falls back to the browser's own zone without Intl.supportedValuesOf", () => {
    const intl = Intl as unknown as { supportedValuesOf?: unknown };
    const original = intl.supportedValuesOf;
    intl.supportedValuesOf = undefined;
    try {
      expect(listTimezones()).toEqual([browserTimezone()]);
    } finally {
      intl.supportedValuesOf = original;
    }
  });
});
