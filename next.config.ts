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
    // Every size is made ahead of time by scripts/make-images.py (keep these widths equal to its WIDTHS).
    // The on-demand optimizer is not used: its first request for each new photo size took seconds.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [480, 828, 1200, 1600],
    imageSizes: [96, 192],
    qualities: [65, 75, 90],
  },
  async redirects() {
    // The colour is called White (Khaled, Oct 7 2026); old links to /cream keep working.
    return [
      { source: "/quiet-confidence/cream", destination: "/quiet-confidence/white", permanent: true },
      // Order tracking is paused until it is finished (Khaled, Oct 7 2026); old links land on the home page.
      { source: "/track", destination: "/", permanent: false },
    ];
  },
  async headers() {
    const photoCache = [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: photoCache },
      { source: "/email/:path*", headers: photoCache },
      // Prepared photos never change (a changed photo gets a new name), so browsers keep them for a year.
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default config;
