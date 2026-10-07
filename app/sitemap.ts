import type { MetadataRoute } from "next";
import { COLORS } from "@/lib/catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...COLORS.map((c) => ({ url: `${SITE_URL}/quiet-confidence/${c}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    { url: `${SITE_URL}/size-guide`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/returns`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
