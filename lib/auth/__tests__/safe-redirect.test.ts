import { describe, expect, it } from "vitest";
import { safeRedirect } from "../safe-redirect";

describe("safeRedirect", () => {
  it("returns a same-origin path with its query", () => {
    expect(safeRedirect("/join/?token=abc")).toBe("/join/?token=abc");
  });

  it("keeps a same-origin path with its query and hash", () => {
    expect(safeRedirect("/settings/?delete-account#danger")).toBe(
      "/settings/?delete-account#danger"
    );
    expect(safeRedirect("/requests/?vacationId=42")).toBe("/requests/?vacationId=42");
  });

  it("falls back to the dashboard when nothing was requested", () => {
    expect(safeRedirect(null)).toBe("/dashboard");
    expect(safeRedirect("")).toBe("/dashboard");
  });

  it("refuses absolute and protocol-relative URLs", () => {
    expect(safeRedirect("https://evil.example/")).toBe("/dashboard");
    expect(safeRedirect("http://evil.example/")).toBe("/dashboard");
    expect(safeRedirect("//evil.example/")).toBe("/dashboard");
  });

  it("refuses a path that a browser reads as another host through a backslash", () => {
    expect(safeRedirect("/\\example.com/")).toBe("/dashboard");
    expect(safeRedirect("/\\example.com/x?y=1#z")).toBe("/dashboard");
    expect(safeRedirect("\\\\example.com/")).toBe("/dashboard");
    expect(safeRedirect("\\/example.com/")).toBe("/dashboard");
  });

  it("refuses a path that does not start at the root", () => {
    expect(safeRedirect("requests/")).toBe("/dashboard");
    expect(safeRedirect("evil.example/")).toBe("/dashboard");
  });

  it("refuses a javascript: URL", () => {
    expect(safeRedirect("javascript:alert(1)")).toBe("/dashboard");
  });

  it("refuses a value carrying a tab", () => {
    expect(safeRedirect("/\t/example.com/")).toBe("/dashboard");
  });

  it("refuses a value carrying a line feed", () => {
    expect(safeRedirect("/\n/example.com/")).toBe("/dashboard");
  });

  it("refuses a value carrying a carriage return", () => {
    expect(safeRedirect("/\r/example.com/")).toBe("/dashboard");
  });
});
