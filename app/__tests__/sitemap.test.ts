import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "../sitemap";
import { SITE_URL } from "@/lib/site";

const PUBLIC_PATHS = [
  "/",
  "/contact/",
  "/privacy/",
  "/security/",
  "/terms/",
  "/dpa/",
  "/cs/privacy/",
  "/cs/terms/",
  "/cs/dpa/",
];

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

  it("should not list help article pages", () => {
    expect(entries.some((entry) => entry.url.includes("/help/"))).toBe(false);
  });

  describe("AI texts", () => {
    const aiPaths = ["/ai-agreement/", "/ai-dpia/", "/cs/ai-agreement/", "/cs/ai-dpia/"];

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should leave out the AI pages while the AI texts are dark", () => {
      vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "");
      const urls = sitemap().map((entry) => entry.url);
      for (const path of aiPaths) expect(urls).not.toContain(`${SITE_URL}${path}`);
    });

    it("should list the AI features agreement and the DPIA page once published", () => {
      vi.stubEnv("NEXT_PUBLIC_AI_TEXTS_PUBLISHED", "2026-12-01");
      expect(
        sitemap()
          .map((entry) => entry.url)
          .sort()
      ).toEqual([...PUBLIC_PATHS, ...aiPaths].map((path) => `${SITE_URL}${path}`).sort());
    });
  });
});
