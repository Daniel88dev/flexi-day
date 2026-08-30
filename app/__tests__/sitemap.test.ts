import { describe, expect, it } from "vitest";
import sitemap from "../sitemap";
import { SITE_URL } from "@/lib/site";

const PUBLIC_PATHS = ["/", "/contact/", "/privacy/", "/security/", "/terms/"];

describe("sitemap", () => {
  const entries = sitemap();

  it("should list exactly the public pages", () => {
    expect(entries.map((entry) => entry.url).sort()).toEqual(
      PUBLIC_PATHS.map((path) => `${SITE_URL}${path}`).sort()
    );
  });

  it("should use absolute canonical URLs with trailing slashes", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith(`${SITE_URL}/`)).toBe(true);
      expect(entry.url.endsWith("/")).toBe(true);
    }
  });

  it("should not list any authenticated or auth-flow route", () => {
    const urls = entries.map((entry) => entry.url);
    for (const blocked of ["/dashboard", "/settings", "/sign-in", "/sign-up"]) {
      expect(urls.some((url) => url.includes(blocked))).toBe(false);
    }
  });
});
