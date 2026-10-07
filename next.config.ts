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
    // WebP only: almost as small as AVIF, far faster for phones to decode and for the server to make.
    formats: ["image/webp"],
    // 65: gallery/cards/hero (fabric still crisp, ~30% lighter); 75 default; 90 full-screen viewer.
    qualities: [65, 75, 90],
    // Resized photos stay cached 30 days (Vercel edge + browser). A changed photo always gets a NEW file name.
    minimumCacheTTL: 2592000,
    deviceSizes: [390, 640, 828, 1080, 1280, 1600, 2048],
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
      { source: "/email/:path*", headers: photoCache },
    ];
  },
};

export default config;
