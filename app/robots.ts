import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required by output: "export" — metadata routes compile to route handlers,
// which the static export refuses without an explicit static marker.
export const dynamic = "force-static";

// Every top-level segment under app/(app)/ and app/(auth)/, since nothing behind a session or an
// auth flow belongs in a search index. The robots test reads the folders and fails when a new
// page is missing here. Bare paths prefix-match their trailing-slash variants, so `/dashboard`
// also covers `/dashboard/`.
// Help pages under /help/ stay crawlable so crawlers can read their noindex; only
// the knowledge base bundle is kept out.
const DISALLOWED_PATHS = [
  "/ai-usage",
  "/billing",
  "/calendar-sync",
  "/dashboard",
  "/directory",
  "/email-verified",
  "/forgot-password",
  "/groups",
  "/help/kb.json",
  "/join",
  "/my-attendance",
  "/oauth",
  "/organization",
  "/report",
  "/requests",
  "/reset-password",
  "/settings",
  "/sign-in",
  "/sign-up",
  "/support",
  "/team-attendance",
  "/two-factor",
  "/verify-email",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOWED_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
