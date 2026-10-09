"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { knownPlace, setPlace, track } from "@/lib/track";

// Egypt's governorates by their official code (what Vercel's network location gives), shown by name.
const GOV: Record<string, string> = {
  C: "Cairo", GZ: "Giza", ALX: "Alexandria", KB: "Qalyubia", SHR: "Sharqia", DK: "Dakahlia", GH: "Gharbia", MNF: "Monufia",
  BH: "Beheira", KFS: "Kafr El Sheikh", DT: "Damietta", PTS: "Port Said", IS: "Ismailia", SUZ: "Suez", FYM: "Fayoum",
  BNS: "Beni Suef", MN: "Minya", AST: "Assiut", SHG: "Sohag", KN: "Qena", LX: "Luxor", ASN: "Aswan", BA: "Red Sea",
  JS: "South Sinai", SIN: "North Sinai", MT: "Matrouh", WAD: "New Valley",
};

const PAGES: [RegExp, string][] = [
  [/^\/$/, "Home"],
  [/^\/quiet-confidence\/white/, "White product"],
  [/^\/quiet-confidence\/burgundy/, "Burgundy product"],
  [/^\/checkout\/done/, "Thank-you page"],
  [/^\/checkout/, "Checkout"],
  [/^\/size-guide/, "Size guide"],
  [/^\/returns/, "Delivery & returns"],
];
const pageName = (p: string) => PAGES.find(([re]) => re.test(p))?.[1] ?? "Other page";

/**
 * Visitor stats helpers (no cookies, no IP kept):
 *  - once per visit: the approximate city, plus whether this device visited before ("Visit" event)
 *  - every page opened, with its city ("Page viewed" event), so navigation can be split by city
 */
export function VisitorPlace() {
  const path = usePathname();

  useEffect(() => {
    if (knownPlace()) return;
    let done = false;
    const finish = (city: string) => {
      if (done) return;
      done = true;
      setPlace(city);
      // First or returning visit on this device (a simple count kept on the phone, nothing personal).
      let n = 1;
      try {
        n = Number(localStorage.getItem("nuriya-visits") || "0") + 1;
        localStorage.setItem("nuriya-visits", String(n));
      } catch {}
      track("Visit", n === 1 ? "First visit" : n === 2 ? "2nd visit" : n <= 5 ? "3rd–5th visit" : "6+ visits");
    };
    const fallback = window.setTimeout(() => finish("Unknown"), 6000);
    fetch("/api/place")
      .then((r) => r.json())
      .then((p: { city?: string; region?: string; country?: string }) => {
        const abroad = Boolean(p.country && p.country !== "EG");
        const gov = abroad ? p.country : (p.region && GOV[p.region]) || p.region;
        finish([p.city, gov].filter(Boolean).join(" · ") || "Unknown");
      })
      .catch(() => finish("Unknown"))
      .finally(() => window.clearTimeout(fallback));
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    track("Page viewed", pageName(path));
  }, [path]);

  return null;
}
