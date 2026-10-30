import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // Content Security Policy: the browser only runs scripts and connects to our own site and Meta (Pixel).
  // 'unsafe-inline' is needed by Next.js's pre-built pages (nonces would make every page slow, server-rendered).
  // Blocks: other sites framing the shop, plugins, foreign forms, and any script/connection to unknown domains.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://www.facebook.com",
      "font-src 'self' data:",
      "connect-src 'self' https://www.facebook.com https://connect.facebook.net",
      "frame-src https://www.facebook.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  // The sales SQL is read by the reports cron at run time (app/api/cron/reports), so ship it with that function.
  outputFileTracingIncludes: { "/api/cron/reports": ["./scripts/sales.sql"] },
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
