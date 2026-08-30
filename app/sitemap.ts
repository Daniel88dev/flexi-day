import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required by output: "export" — metadata routes compile to route handlers,
// which the static export refuses without an explicit static marker.
export const dynamic = "force-static";

// Only the standalone public pages: the landing page and app/(legal)/.
// Everything under (app) and (auth) is disallowed in robots.ts and has no
// business in a sitemap. Trailing slashes match `trailingSlash: true`.
const PUBLIC_PATHS = ["/", "/contact/", "/privacy/", "/security/", "/terms/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
