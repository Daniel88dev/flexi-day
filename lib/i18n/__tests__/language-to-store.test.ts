import { describe, expect, it } from "vitest";
import { languageToStore } from "../language-to-store";

describe("languageToStore", () => {
  it("returns the active language when the stored one differs", () => {
    expect(languageToStore("en", "cs")).toBe("cs");
    expect(languageToStore("cs", "en")).toBe("en");
  });

  it("returns the active language when none is stored yet, English included", () => {
    expect(languageToStore(null, "cs")).toBe("cs");
    expect(languageToStore(null, "en")).toBe("en");
  });

  it("returns null when the stored language already matches", () => {
    expect(languageToStore("cs", "cs")).toBeNull();
    expect(languageToStore("en", "en")).toBeNull();
  });

  it("returns null against a backend whose settings carry no language", () => {
    expect(languageToStore(undefined, "cs")).toBeNull();
  });
});
