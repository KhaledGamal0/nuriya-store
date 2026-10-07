import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Put the (small) stylesheet inside the HTML so the first paint does not wait for a CSS download.
    inlineCss: true,
  },
  poweredByHeader: false,
  images: {
    // Photos are prepared ahead of time (scripts/make-images.py) and served as static WebP files from the CDN.
    // Widths here must match WIDTHS in that script.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [480, 828, 1200, 1600],
    imageSizes: [96, 192],
    qualities: [65, 75, 90],
  },
  async redirects() {
    // The colour is called White (Khaled, Oct 7 2026); old links to /cream keep working.
    return [{ source: "/quiet-confidence/cream", destination: "/quiet-confidence/white", permanent: true }];
  },
  async headers() {
    const photoCache = [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: photoCache },
      // Prepared photos never change under the same name (a changed photo gets a new name): cache for a year.
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/email/:path*", headers: photoCache },
    ];
  },
};

export default config;
