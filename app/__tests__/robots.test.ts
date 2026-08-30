import { describe, expect, it } from "vitest";
import robots from "../robots";

const PUBLIC_PATHS = ["/", "/contact", "/privacy", "/security", "/terms"];

const APP_PATHS = [
  "/billing",
  "/calendar-sync",
  "/dashboard",
  "/groups",
  "/organization",
  "/report",
  "/requests",
  "/settings",
  "/support",
];

const AUTH_PATHS = [
  "/email-verified",
  "/forgot-password",
  "/reset-password",
  "/sign-in",
  "/sign-up",
  "/two-factor",
  "/verify-email",
];

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

  it("should point crawlers at the sitemap", () => {
    expect(result.sitemap).toBe("https://www.flexi-day.com/sitemap.xml");
  });
});
