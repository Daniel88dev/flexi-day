import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listAppRoutes } from "@/lib/help/knowledge-base";
import robots from "../robots";

const PUBLIC_PATHS = ["/", "/contact", "/privacy", "/security", "/terms"];

// Derived from the folders so a new page fails this test until robots.ts lists it.
function topLevelPaths(routeGroup: string): string[] {
  const routes = listAppRoutes(join(process.cwd(), "app", routeGroup));
  return [...new Set(routes.map((route) => `/${route.split("/")[1]}`))];
}

const APP_PATHS = topLevelPaths("(app)");
const AUTH_PATHS = topLevelPaths("(auth)");

describe("robots", () => {
  const result = robots();
  const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
  const disallow = Array.isArray(rule?.disallow) ? rule.disallow : [rule?.disallow];

  it("should apply a single rule to all user agents", () => {
    expect(Array.isArray(result.rules) ? result.rules : [result.rules]).toHaveLength(1);
    expect(rule?.userAgent).toBe("*");
  });

  it("should allow the site root so public pages stay crawlable", () => {
    expect(rule?.allow).toBe("/");
  });

  it.each(APP_PATHS)("should disallow the authenticated app route %s", (path) => {
    expect(disallow).toContain(path);
  });

  it.each(AUTH_PATHS)("should disallow the auth flow %s", (path) => {
    expect(disallow).toContain(path);
  });

  it.each(PUBLIC_PATHS)("should leave the public page %s crawlable", (path) => {
    for (const blocked of disallow) {
      expect(blocked && path.startsWith(blocked)).toBe(false);
    }
  });

  it("should keep help pages crawlable so crawlers read their noindex", () => {
    for (const path of ["/help/assistant/", "/cs/help/assistant/"]) {
      for (const blocked of disallow) {
        expect(blocked && path.startsWith(blocked)).toBe(false);
      }
    }
  });

  it("should leave the dev-only sign-in page out of the list", () => {
    expect(AUTH_PATHS).not.toContain("/dev-sign-in");
    expect(disallow).not.toContain("/dev-sign-in");
  });

  it("should disallow the knowledge base bundle", () => {
    expect(disallow).toContain("/help/kb.json");
  });

  it("should point crawlers at the sitemap", () => {
    expect(result.sitemap).toBe("https://www.flexi-day.com/sitemap.xml");
  });
});
