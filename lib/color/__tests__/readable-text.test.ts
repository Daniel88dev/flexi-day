import { describe, expect, it } from "vitest";
import { readableForeground } from "../readable-text";

describe("readableForeground", () => {
  it("returns white on dark backgrounds", () => {
    expect(readableForeground("#111111")).toBe("#fff");
    expect(readableForeground("#4a3aa7")).toBe("#fff");
    expect(readableForeground("hsl(262, 49%, 44%)")).toBe("#fff");
    expect(readableForeground("hsl(0, 65%, 50%)")).toBe("#fff");
  });

  it("returns near-black on light backgrounds", () => {
    expect(readableForeground("#ffffff")).toBe("#111827");
    expect(readableForeground("#7fe3d8")).toBe("#111827");
    expect(readableForeground("hsl(170, 64%, 70%)")).toBe("#111827");
    expect(readableForeground("hsl(90, 80%, 75%)")).toBe("#111827");
  });

  it("returns near-black on mid oranges where white only reaches ~3:1", () => {
    // Generated avatar hues ~25-45 at 65%/50% sit in the 3.0-3.2:1 band for
    // white — readable only under the large-text tier, and initials are small.
    expect(readableForeground("hsl(30, 65%, 50%)")).toBe("#111827");
    expect(readableForeground("hsl(40, 65%, 50%)")).toBe("#111827");
  });

  it("keeps white on mid-tone colors where white has the higher contrast", () => {
    expect(readableForeground("#2a78d6")).toBe("#fff");
    expect(readableForeground("hsl(220, 65%, 50%)")).toBe("#fff");
  });

  it("judges gradients by their first color stop", () => {
    expect(readableForeground("linear-gradient(135deg, #e9b15a, #d99a3f)")).toBe("#111827");
    expect(readableForeground("linear-gradient(135deg, #4a3aa7, #7c6fd0)")).toBe("#fff");
    expect(readableForeground("linear-gradient(90deg, hsl(90, 80%, 75%), hsl(90, 80%, 55%))")).toBe(
      "#111827"
    );
  });

  it("supports 3-digit hex and hsl variants", () => {
    expect(readableForeground("#fff")).toBe("#111827");
    expect(readableForeground("#000")).toBe("#fff");
    expect(readableForeground("hsl(170deg 64% 70%)")).toBe("#111827");
    expect(readableForeground("hsl(-190, 64%, 70%)")).toBe("#111827");
  });

  it("falls back to white when the color cannot be parsed", () => {
    expect(readableForeground("var(--whatever)")).toBe("#fff");
    expect(readableForeground("")).toBe("#fff");
    expect(readableForeground("hsl(1.2.3, 65%, 50%)")).toBe("#fff");
  });
});
