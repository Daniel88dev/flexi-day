import { describe, expect, it } from "vitest";
import { isExternalWorker, looksLikeEmail } from "../person";

describe("looksLikeEmail", () => {
  it("returns true for an address with a domain", () => {
    expect(looksLikeEmail("ada@example.com")).toBe(true);
  });

  it("returns false for text without an at sign, a dot or with spaces", () => {
    expect(looksLikeEmail("ada")).toBe(false);
    expect(looksLikeEmail("ada@example")).toBe(false);
    expect(looksLikeEmail("ada @example.com")).toBe(false);
  });
});

describe("isExternalWorker", () => {
  it("returns true only with the External worker marker", () => {
    expect(isExternalWorker({ markers: ["EXTERNAL_WORKER", "NO_ACCOUNT"] })).toBe(true);
    expect(isExternalWorker({ markers: ["NO_ACCOUNT"] })).toBe(false);
  });
});
