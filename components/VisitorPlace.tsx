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
      track("1 · Visitor", n === 1 ? "New visitor" : n === 2 ? "Returning (2nd visit)" : n <= 5 ? "Returning (3–5 visits)" : "Returning (6+ visits)");
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
    track("Page opened", pageName(path));
    const page = pageName(path);
    const t0 = Date.now();
    // How far down the page people scroll (25 / 50 / 75 / 100 %), each step once per visit.
    let deepest = 0;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max <= 0) return;
      const pct = Math.floor(((scrollY / max) * 100) / 25) * 25;
      if (pct > deepest && pct >= 25) {
        deepest = pct;
        track("Page · scrolled", `${page} · ${pct}%`);
      }
    };
    // How long people stay on each page, sent when they leave it.
    const sent = { done: false };
    const leave = () => {
      if (sent.done) return;
      sent.done = true;
      const s = (Date.now() - t0) / 1000;
      const bucket = s < 10 ? "under 10 s" : s < 30 ? "10–30 s" : s < 60 ? "30–60 s" : s < 180 ? "1–3 min" : "3+ min";
      track("Page · time spent", `${page} · ${bucket}`);
    };
    const onHide = () => document.visibilityState === "hidden" && leave();
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    return () => {
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      leave();
    };
  }, [path]);

  // Taps on links: Instagram anywhere, and menu / footer links (which way people move around the site).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const text = (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) || href;
      const from = pageName(location.pathname);
      if (/instagram\.com/.test(href)) track("Link · Instagram tapped", from);
      else if (/linkedin\.com|github\.io/.test(href)) track("Link · site credit tapped", text);
      else if (a.closest("header, dialog")) track("Menu · link tapped", text);
      else if (a.closest("footer")) track("Footer · link tapped", text);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
