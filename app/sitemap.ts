import type { MetadataRoute } from "next";
import { aiTextsPublished } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

// Required by output: "export" — metadata routes compile to route handlers,
// which the static export refuses without an explicit static marker.
export const dynamic = "force-static";

// Only the standalone public pages: the landing page and app/(legal)/.
// Everything under (app) and (auth) is disallowed in robots.ts and has no
// business in a sitemap. Trailing slashes match `trailingSlash: true`.
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

// Published on Day 0 with the AI texts (lib/legal.ts); reachable but noindex before that.
const AI_PATHS = ["/ai-agreement/", "/ai-dpia/", "/cs/ai-agreement/", "/cs/ai-dpia/"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = aiTextsPublished() ? [...PUBLIC_PATHS, ...AI_PATHS] : PUBLIC_PATHS;
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
