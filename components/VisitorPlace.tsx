"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Once per visit: count which city the visitor is in (approximate, from the network; no personal data). */
export function VisitorPlace() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("place-sent")) return;
      sessionStorage.setItem("place-sent", "1");
    } catch {
      return;
    }
    const t = window.setTimeout(() => {
      fetch("/api/place")
        .then((r) => r.json())
        .then((p: { city?: string; region?: string; country?: string }) => {
          const where = p.country && p.country !== "EG" ? `${p.city || "?"}, ${p.country}` : p.city || "Unknown";
          track("Visitor city", { city: where, region: p.region || p.country || "?" });
        })
        .catch(() => {});
    }, 2500); // after the page has loaded: never competes with photos
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
