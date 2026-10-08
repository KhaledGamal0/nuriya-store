"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Egypt's governorates by their official code (what Vercel's network location gives), shown by name.
const GOV: Record<string, string> = {
  C: "Cairo", GZ: "Giza", ALX: "Alexandria", KB: "Qalyubia", SHR: "Sharqia", DK: "Dakahlia", GH: "Gharbia", MNF: "Monufia",
  BH: "Beheira", KFS: "Kafr El Sheikh", DT: "Damietta", PTS: "Port Said", IS: "Ismailia", SUZ: "Suez", FYM: "Fayoum",
  BNS: "Beni Suef", MN: "Minya", AST: "Assiut", SHG: "Sohag", KN: "Qena", LX: "Luxor", ASN: "Aswan", BA: "Red Sea",
  JS: "South Sinai", SIN: "North Sinai", MT: "Matrouh", WAD: "New Valley",
};

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
          const abroad = Boolean(p.country && p.country !== "EG");
          const region = abroad ? `Outside Egypt (${p.country})` : (p.region && GOV[p.region]) || p.region || "Unknown";
          track("Visitor city", { city: p.city ? (abroad ? `${p.city}, ${p.country}` : p.city) : "Unknown", governorate: region });
        })
        .catch(() => {});
    }, 2500); // after the page has loaded: never competes with photos
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
