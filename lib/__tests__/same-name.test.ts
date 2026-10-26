import { describe, expect, it } from "vitest";
import { sameName } from "../same-name";

describe("sameName", () => {
  it("returns true for the same name typed with other case and spacing", () => {
    expect(sameName("  acme   corp ", "Acme Corp")).toBe(true);
  });

  it("returns true for a name typed in another Unicode form", () => {
    expect(sameName("Zbyněk", "Zbyněk")).toBe(true);
  });

  it("returns false for another name", () => {
    expect(sameName("Acme", "Acme Corp")).toBe(false);
  });
});
