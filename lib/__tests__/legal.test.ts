import { describe, expect, it } from "vitest";
import { legalHref } from "../legal";

describe("legalHref", () => {
  it("returns the English page for an English reader", () => {
    expect(legalHref("privacy", "en")).toBe("/privacy/");
    expect(legalHref("terms", "en")).toBe("/terms/");
  });

  it("returns the Czech twin for a Czech reader", () => {
    expect(legalHref("privacy", "cs")).toBe("/cs/privacy/");
    expect(legalHref("dpa", "cs")).toBe("/cs/dpa/");
  });
});
