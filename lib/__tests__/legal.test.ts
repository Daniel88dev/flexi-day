import { afterEach, describe, expect, it, vi } from "vitest";
import { aiTextsPublished, aiTextsUpdated, legalHref } from "../legal";

describe("legalHref", () => {
  it("returns the English page for an English reader", () => {
    expect(legalHref("privacy", "en")).toBe("/privacy/");
    expect(legalHref("terms", "en")).toBe("/terms/");
  });

  it("returns the Czech twin for a Czech reader", () => {
    expect(legalHref("privacy", "cs")).toBe("/cs/privacy/");
    expect(legalHref("dpa", "cs")).toBe("/cs/dpa/");
    expect(legalHref("ai-dpia", "cs")).toBe("/cs/ai-dpia/");
  });
});

describe("aiTextsPublished", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false while the build carries no publication date", () => {
    vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "");
    expect(aiTextsPublished()).toBe(false);
  });

  it("returns true with a publication date", () => {
    vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "2026-12-01");
    expect(aiTextsPublished()).toBe(true);
  });

  it("throws on a value that is not a date, so a bad variable fails the build", () => {
    vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "1");
    expect(() => aiTextsPublished()).toThrow(/NEXT_PUBLIC_AI_TEXTS_PUBLISHED/);
    vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "2026-02-30");
    expect(() => aiTextsPublished()).toThrow(/NEXT_PUBLIC_AI_TEXTS_PUBLISHED/);
  });
});

describe("aiTextsUpdated", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the shared update date while the AI texts are dark", () => {
    vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "");
    expect(aiTextsUpdated("en")).toBe("28 October 2026");
    expect(aiTextsUpdated("cs")).toBe("28. října 2026");
  });

  it("returns the publication date in each language once published", () => {
    vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "2026-12-01");
    expect(aiTextsUpdated("en")).toBe("1 December 2026");
    expect(aiTextsUpdated("cs")).toBe("1. prosince 2026");
  });
});
