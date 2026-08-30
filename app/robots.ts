import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required by output: "export" — metadata routes compile to route handlers,
// which the static export refuses without an explicit static marker.
export const dynamic = "force-static";

// Everything under app/(app)/ and app/(auth)/ — nothing behind a session or an
// auth flow belongs in a search index. Bare paths prefix-match their
// trailing-slash variants, so `/dashboard` also covers `/dashboard/`.
const DISALLOWED_PATHS = [
  "/billing",
  "/calendar-sync",
  "/dashboard",
  "/email-verified",
  "/forgot-password",
  "/groups",
  "/organization",
  "/report",
  "/requests",
  "/reset-password",
  "/settings",
  "/sign-in",
  "/sign-up",
  "/support",
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
