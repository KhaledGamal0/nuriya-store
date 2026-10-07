import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const SITE_URL = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/checkout"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
