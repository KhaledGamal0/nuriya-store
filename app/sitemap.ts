import type { MetadataRoute } from "next";
import { COLORS, productPath } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

const SITE_URL = siteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...COLORS.map((c) => ({ url: `${SITE_URL}${productPath(c)}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    { url: `${SITE_URL}/size-guide`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/returns`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
