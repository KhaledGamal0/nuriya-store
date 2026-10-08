// Server-side checkout rules. The browser only sends WHAT the customer wants (color, size, quantity);
// every price, fee and total is computed here from the catalog and the shipping table.
import { isColor, isSize, priceFor, staticCatalog, type CatalogData, type ColorId, type SizeId } from "./catalog.ts";
import { AREAS, type Area } from "./shipping.ts";

/** What checkout needs to know about the store right now (from the database in production). */
export type CheckoutContext = { catalog: CatalogData; areas: readonly Area[] };
const STATIC_CONTEXT: CheckoutContext = { catalog: staticCatalog(), areas: AREAS };

export const MAX_QTY_PER_LINE = 5;
export const MAX_LINES = 8;

export type CartLine = { color: ColorId; size: SizeId; qty: number };
export type PaymentMethod = "cod" | "card";

export type CheckoutInput = {
  phone: unknown;
  /** Optional second mobile number. */
  phone2?: unknown;
  name: unknown;
  areaId: unknown;
  address: unknown;
  payment: unknown;
  cart: unknown;
};

export type PricedLine = CartLine & { unitPiasters: number; linePiasters: number };

export type ValidOrder = {
  phone: string;
  /** Second number to try if the first doesn't answer, or null. */
  altPhone: string | null;
  name: string;
  area: Area;
  address: string;
  payment: PaymentMethod;
  lines: PricedLine[];
  subtotalPiasters: number;
  shippingPiasters: number;
  totalPiasters: number;
};

export type FieldErrors = Partial<Record<"phone" | "phone2" | "name" | "area" | "address" | "payment" | "cart", string>>;

export type CheckoutResult = { ok: true; order: ValidOrder } | { ok: false; errors: FieldErrors };

/** Egyptian mobile: 010, 011, 012 or 015 + 8 digits. Accepts spaces, dashes and +20 / 0020. */
/** Arabic-Indic (٠١٢…) and Persian (۰۱۲…) digits → 0-9. Many Egyptian phones type these. */
export function toLatinDigits(s: string): string {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/** What the shopper sees while typing: digits only, grouped 010 1234 5678. +20 / 0020 become 0. */
export function formatPhoneInput(raw: string): string {
  let d = toLatinDigits(raw).replace(/[^\d+]/g, "");
  if (d.startsWith("+20")) d = "0" + d.slice(3);
  else if (d.startsWith("0020")) d = "0" + d.slice(4);
  else if (/^20\d{10}$/.test(d)) d = "0" + d.slice(2);
  d = d.replace(/\D/g, "").slice(0, 11);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7)].filter(Boolean).join(" ");
}

export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 40) return null;
  let digits = toLatinDigits(raw).replace(/[\s\-().\u200e\u200f\u202a-\u202e]/g, "");
  if (digits.startsWith("+20")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0020")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12) digits = "0" + digits.slice(2);
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}

/** Parse and clean the cart sent by the browser. Unknown items are rejected; duplicates are merged. */
export function parseCart(raw: unknown): CartLine[] | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(data) || data.length === 0 || data.length > MAX_LINES) return null;
  const merged = new Map<string, CartLine>();
  for (const item of data) {
    if (typeof item !== "object" || item === null) return null;
    const { color, size, qty } = item as Record<string, unknown>;
    if (!isColor(color) || !isSize(size)) return null;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) return null;
    const key = `${color}|${size}`;
    const prev = merged.get(key);
    merged.set(key, { color, size, qty: Math.min(MAX_QTY_PER_LINE, (prev?.qty ?? 0) + qty) });
  }
  return [...merged.values()];
}

/** Removes control characters (incl. NUL, which Postgres refuses), invisible direction overrides
 * and zero-width characters, collapses spaces, trims, and caps the length. */
export function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .slice(0, max * 4)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export const MESSAGES = {
  phone: "Enter an Egyptian mobile number, like 010 1234 5678.",
  phone2: "Enter another Egyptian mobile number, or leave this empty.",
  phone2Same: "This is the same as your main number. Add a different one, or leave it empty.",
  name: "Enter your full name.",
  area: "Choose your area.",
  address: "Add your street, building and floor.",
  payment: "Choose how you want to pay.",
  cart: "Your bag is empty or has an item we could not find.",
  soldOut: "Sorry, one of the sizes in your bag has just sold out. Please update your bag.",
} as const;

/** Check one field. Used live in the browser and again on the server. */
export function fieldError(field: "phone" | "phone2" | "name" | "area" | "address", value: unknown, main?: unknown): string | undefined {
  switch (field) {
    case "phone":
      return normalizePhone(value) ? undefined : MESSAGES.phone;
    case "phone2": {
      if (typeof value !== "string" || value.trim() === "") return undefined; // optional
      const p = normalizePhone(value);
      if (!p) return MESSAGES.phone2;
      return p === normalizePhone(main) ? MESSAGES.phone2Same : undefined;
    }
    case "name":
      return cleanText(value, 80).length >= 3 ? undefined : MESSAGES.name;
    case "area":
      // The browser only checks that an area was chosen; the server checks it exists and is active.
      return typeof value === "string" && value.length > 0 ? undefined : MESSAGES.area;
    case "address":
      return cleanText(value, 300).length >= 10 ? undefined : MESSAGES.address;
  }
}

export function validateCheckout(input: CheckoutInput, ctx: CheckoutContext = STATIC_CONTEXT): CheckoutResult {
  const errors: FieldErrors = {};

  const phone = normalizePhone(input.phone);
  if (!phone) errors.phone = MESSAGES.phone;
  const phone2Error = fieldError("phone2", input.phone2, input.phone);
  if (phone2Error) errors.phone2 = phone2Error;
  const altPhone = phone2Error ? null : normalizePhone(input.phone2);

  const name = cleanText(input.name, 80);
  if (name.length < 3) errors.name = MESSAGES.name;

  const area = typeof input.areaId === "string" ? ctx.areas.find((a) => a.id === input.areaId) : undefined;
  if (!area) errors.area = MESSAGES.area;

  const address = cleanText(input.address, 300);
  if (address.length < 10) errors.address = MESSAGES.address;

  const payment = input.payment === "card" ? "card" : input.payment === "cod" ? "cod" : null;
  if (!payment) errors.payment = MESSAGES.payment;

  const cart = parseCart(input.cart);
  if (!cart) errors.cart = MESSAGES.cart;

  if (!phone || !area || !payment || !cart || Object.keys(errors).length > 0) return { ok: false, errors };

  const lines: PricedLine[] = [];
  for (const line of cart) {
    const unit = priceFor(ctx.catalog, line.color, line.size);
    if (unit === null) return { ok: false, errors: { cart: MESSAGES.soldOut } };
    lines.push({ ...line, unitPiasters: unit, linePiasters: unit * line.qty });
  }
  const subtotalPiasters = lines.reduce((sum, l) => sum + l.linePiasters, 0);
  const shippingPiasters = area.feePiasters;

  return {
    ok: true,
    order: {
      phone,
      altPhone,
      name,
      area,
      address,
      payment,
      lines,
      subtotalPiasters,
      shippingPiasters,
      totalPiasters: subtotalPiasters + shippingPiasters,
    },
  };
}

/** Human-friendly, hard-to-guess order number, e.g. NUR-7K3Q9P. */
export function newOrderNumber(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = random(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `NUR-${out}`;
}
