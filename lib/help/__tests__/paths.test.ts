import { describe, expect, it } from "vitest";
import { articlePath } from "../paths";

describe("articlePath", () => {
  it("returns the English page at the root", () => {
    expect(articlePath("en", "half-days-and-times")).toBe("/help/half-days-and-times/");
  });

  it("returns the Czech page under /cs", () => {
    expect(articlePath("cs", "half-days-and-times")).toBe("/cs/help/half-days-and-times/");
  });
});
