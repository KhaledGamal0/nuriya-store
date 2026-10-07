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
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1280, 1600, 2048],
  },
  async redirects() {
    // The colour is called White (Khaled, Oct 7 2026); old links to /cream keep working.
    return [{ source: "/quiet-confidence/cream", destination: "/quiet-confidence/white", permanent: true }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
