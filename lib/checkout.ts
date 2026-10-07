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
  name: unknown;
  areaId: unknown;
  address: unknown;
  payment: unknown;
  cart: unknown;
};

export type PricedLine = CartLine & { unitPiasters: number; linePiasters: number };

export type ValidOrder = {
  phone: string;
  name: string;
  area: Area;
  address: string;
  payment: PaymentMethod;
  lines: PricedLine[];
  subtotalPiasters: number;
  shippingPiasters: number;
  totalPiasters: number;
};

export type FieldErrors = Partial<Record<"phone" | "name" | "area" | "address" | "payment" | "cart", string>>;

export type CheckoutResult = { ok: true; order: ValidOrder } | { ok: false; errors: FieldErrors };

/** Egyptian mobile: 010, 011, 012 or 015 + 8 digits. Accepts spaces, dashes and +20 / 0020. */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let digits = raw.replace(/[\s\-().]/g, "");
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

function cleanText(raw: unknown, max: number): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export const MESSAGES = {
  phone: "Enter an Egyptian mobile number, like 010 1234 5678.",
  name: "Enter your full name.",
  area: "Choose your area.",
  address: "Add your street, building and floor.",
  payment: "Choose how you want to pay.",
  cart: "Your bag is empty or has an item we could not find.",
  soldOut: "Sorry, one of the sizes in your bag has just sold out. Please update your bag.",
} as const;

/** Check one field. Used live in the browser and again on the server. */
export function fieldError(field: "phone" | "name" | "area" | "address", value: unknown): string | undefined {
  switch (field) {
    case "phone":
      return normalizePhone(value) ? undefined : MESSAGES.phone;
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
