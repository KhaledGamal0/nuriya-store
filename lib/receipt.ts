// What the thank-you page shows. Built on the server from the order it just saved, handed to the
// browser once, and kept only in that tab (sessionStorage) — never in the URL, so a shared or
// guessed link reveals nothing but the order number.
import type { ColorId, SizeId } from "./catalog.ts";

export type Receipt = {
  number: string;
  payment: "cod" | "card";
  name: string;
  phone: string;
  area: string;
  address: string;
  lines: { color: ColorId; size: SizeId; qty: number; linePiasters: number }[];
  subtotalPiasters: number;
  shippingPiasters: number;
  totalPiasters: number;
};

const key = (number: string) => `nuriya:receipt:${number}`;

export function keepReceipt(r: Receipt): void {
  try {
    sessionStorage.setItem(key(r.number), JSON.stringify(r));
  } catch {
    /* private mode: the page falls back to the order number only */
  }
}

export function readReceipt(number: string): Receipt | null {
  try {
    const raw = sessionStorage.getItem(key(number));
    const r = raw ? (JSON.parse(raw) as Receipt) : null;
    return r && r.number === number && Array.isArray(r.lines) ? r : null;
  } catch {
    return null;
  }
}

/** "010 1234 5678" */
export function prettyPhone(p: string): string {
  return p.length === 11 ? `${p.slice(0, 3)} ${p.slice(3, 7)} ${p.slice(7)}` : p;
}
