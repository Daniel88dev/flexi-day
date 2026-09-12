import { describe, it, expect } from "vitest";
import { cn, initials } from "@/lib/utils";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-sm")).toBe("text-sm");
  });

  it("merges multiple classes", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("deduplicates conflicting Tailwind classes, keeping the last one", () => {
    // tailwind-merge keeps the latter of two conflicting utilities
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("ignores falsy values", () => {
    expect(cn("text-sm", false, undefined, null, "font-bold")).toBe("text-sm font-bold");
  });

  it("handles conditional classes via objects", () => {
    expect(cn({ "text-sm": true, "font-bold": false })).toBe("text-sm");
  });

  it("returns an empty string when given no truthy arguments", () => {
    expect(cn(false, undefined)).toBe("");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words, upper-cased", () => {
    expect(initials("dana holt")).toBe("DH");
    expect(initials("Dana Holt Jr")).toBe("DH");
  });

  it("handles a single name and stray spaces", () => {
    expect(initials("Dana")).toBe("D");
    expect(initials("  Dana  Holt")).toBe("DH");
  });

  it("returns a placeholder without a name", () => {
    expect(initials(null)).toBe("?");
    expect(initials("")).toBe("?");
  });
});
