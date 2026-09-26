import { describe, expect, it } from "vitest";
import { safeRedirect } from "../safe-redirect";

describe("safeRedirect", () => {
  it("returns a same-origin path with its query", () => {
    expect(safeRedirect("/join/?token=abc")).toBe("/join/?token=abc");
  });

  it("falls back to the dashboard when nothing was requested", () => {
    expect(safeRedirect(null)).toBe("/dashboard");
    expect(safeRedirect("")).toBe("/dashboard");
  });

  it("refuses absolute and protocol-relative URLs", () => {
    expect(safeRedirect("https://evil.example/")).toBe("/dashboard");
    expect(safeRedirect("//evil.example/")).toBe("/dashboard");
  });
});
