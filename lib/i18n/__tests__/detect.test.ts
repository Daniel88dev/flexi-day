import { describe, expect, it } from "vitest";
import { resolveInitialLocale } from "../detect";

describe("resolveInitialLocale", () => {
  it("returns a valid stored locale over the browser language", () => {
    expect(resolveInitialLocale("cs", "en-US")).toBe("cs");
    expect(resolveInitialLocale("en", "cs-CZ")).toBe("en");
  });

  it("ignores an invalid stored value and falls back to detection", () => {
    expect(resolveInitialLocale("de", "cs-CZ")).toBe("cs");
    expect(resolveInitialLocale("", "en-GB")).toBe("en");
    expect(resolveInitialLocale(null, "cs")).toBe("cs");
    expect(resolveInitialLocale(undefined, "fr")).toBe("en");
  });

  it("detects Czech from the browser language, case-insensitively", () => {
    expect(resolveInitialLocale(null, "cs")).toBe("cs");
    expect(resolveInitialLocale(null, "cs-CZ")).toBe("cs");
    expect(resolveInitialLocale(null, "CS-cz")).toBe("cs");
  });

  it("defaults to English for any non-Czech language or missing input", () => {
    expect(resolveInitialLocale(null, "en-US")).toBe("en");
    expect(resolveInitialLocale(null, "sk-SK")).toBe("en");
    expect(resolveInitialLocale(null, null)).toBe("en");
    expect(resolveInitialLocale(undefined, undefined)).toBe("en");
  });
});
