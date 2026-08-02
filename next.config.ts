import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Local dev tooling. `*.dev.tsx` files are only treated as routes when this is
// on, so `app/(auth)/dev-sign-in/page.dev.tsx` is not merely dead code in a
// production build — Next never sees it as a page and it is never exported.
const devTools = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_TOOLS === "1";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  pageExtensions: devTools ? ["dev.tsx", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
  // Pin the workspace root: stray lockfiles higher up (e.g. ~/pnpm-lock.yaml)
  // make Next infer the wrong root, which mis-anchors the Turbopack cache.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "freelancer-ldp",

  project: "flexi-day-fe",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
