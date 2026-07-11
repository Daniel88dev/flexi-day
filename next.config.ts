import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into `out/` for hosting on S3/CloudFront.
  output: "export",
  // Map routes to `/path/index.html` so they resolve cleanly as S3 objects.
  trailingSlash: true,
};

export default nextConfig;
