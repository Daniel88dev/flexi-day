import { describe, expect, it } from "vitest";
import { formatMinutes, formatSignedMinutes, parseMinutes } from "../duration";

describe("formatMinutes", () => {
  it("renders minutes as h:mm with a padded minute", () => {
    expect(formatMinutes(480)).toBe("8:00");
    expect(formatMinutes(360)).toBe("6:00");
    expect(formatMinutes(125)).toBe("2:05");
    expect(formatMinutes(0)).toBe("0:00");
  });

  it("goes past twelve hours rather than wrapping", () => {
    expect(formatMinutes(960)).toBe("16:00");
  });

  it("returns 0:00 for a negative or non-finite value", () => {
    expect(formatMinutes(-30)).toBe("0:00");
    expect(formatMinutes(Number.NaN)).toBe("0:00");
  });
});

describe("parseMinutes", () => {
  it("returns the total minutes of an h:mm value", () => {
    expect(parseMinutes("8:00")).toBe(480);
    expect(parseMinutes("0:30")).toBe(30);
    expect(parseMinutes("16:00")).toBe(960);
    expect(parseMinutes("2:5")).toBe(125);
  });

  it("reads a bare number as whole hours", () => {
    expect(parseMinutes("8")).toBe(480);
  });

  it("ignores surrounding whitespace", () => {
    expect(parseMinutes("  8:00 ")).toBe(480);
  });

  it("returns null for anything it cannot read", () => {
    expect(parseMinutes("")).toBeNull();
    expect(parseMinutes("eight")).toBeNull();
    expect(parseMinutes("8:60")).toBeNull();
    expect(parseMinutes("8.5")).toBeNull();
    expect(parseMinutes("-1:00")).toBeNull();
  });

  it("returns null past twenty-four hours", () => {
    expect(parseMinutes("24:00")).toBe(1440);
    expect(parseMinutes("24:01")).toBeNull();
    expect(parseMinutes("25:00")).toBeNull();
  });
});

describe("formatSignedMinutes", () => {
  it("signs a balance in both directions", () => {
    expect(formatSignedMinutes(11)).toBe("+0:11");
    expect(formatSignedMinutes(-25)).toBe("-0:25");
    expect(formatSignedMinutes(-505)).toBe("-8:25");
  });

  it("leaves a balance of nothing unsigned", () => {
    expect(formatSignedMinutes(0)).toBe("0:00");
    expect(formatSignedMinutes(Number.NaN)).toBe("0:00");
  });
});
