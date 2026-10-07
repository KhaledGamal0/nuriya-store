// Saving orders. Everything that touches money or stock happens here, inside ONE database transaction:
// the order, its items, the customer, the stock reservation and the history line are saved together
// or not at all. Plain SQL (always parameterized) so the locking is explicit and reviewable.
import { createHash } from "node:crypto";
import type { Sql } from "./db/index.ts";
import { newOrderNumber, normalizePhone, type ValidOrder } from "./checkout.ts";

const PRODUCT_SLUG = "quiet-confidence";

/** Business limits. Defaults agreed Oct 7 2026; change here (later: in admin). */
export const LIMITS = {
  checkoutPerDevice: { max: 10, windowSec: 600 }, // attempts per IP per 10 minutes
  ordersPerPhonePerDay: 3,
  trackPerDevice: { max: 20, windowSec: 600 },
} as const;

/** Card payments stay off until Paymob is connected (Phase 4), so no unpaid card order can exist. */
export function cardPaymentsEnabled(): boolean {
  return process.env.PAYMOB_ENABLED === "1";
}

export type RefusalReason =
  | "rate_limited"
  | "phone_limit"
  | "blocked"
  | "sold_out"
  | "price_changed"
  | "area_unavailable"
  | "card_unavailable"
  | "cod_unavailable"
  | "bad_key";

export type PlaceResult =
  | { ok: true; number: string; payment: "cod" | "card"; existing: boolean; soldOutNow: boolean }
  | { ok: false; reason: RefusalReason };

class Refusal extends Error {
  readonly reason: RefusalReason;
  constructor(reason: RefusalReason) {
    super(reason);
    this.reason = reason;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One-way hash of the buyer's IP: enough to spot abuse, useless to anyone who reads the database. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || process.env.REVALIDATE_SECRET || "nuriya";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 32);
}

/** Fixed-window counter. Returns true while under the limit. */
export async function allow(sql: Sql, key: string, max: number, windowSec: number): Promise<boolean> {
  const [row] = await sql<{ count: number }[]>`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, to_timestamp(floor(extract(epoch FROM now()) / ${windowSec}) * ${windowSec}), 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`;
  if (Math.random() < 0.02) await sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`;
  return row.count <= max;
}

async function existingOrder(sql: Sql, key: string, phone: string): Promise<PlaceResult | null> {
  const [row] = await sql<{ number: string; payment_method: "cod" | "card"; customer_phone: string }[]>`
    SELECT number, payment_method, customer_phone FROM orders WHERE idempotency_key = ${key}`;
  if (!row) return null;
  // Same key with another phone is not a retry: someone is replaying a key. Refuse.
  if (row.customer_phone !== phone) return { ok: false, reason: "bad_key" };
  return { ok: true, number: row.number, payment: row.payment_method, existing: true, soldOutNow: false };
}

type VariantRow = {
  id: number;
  color: string;
  size: string;
  unit: number;
  product_name: string;
  color_name: string;
  sellable: boolean;
};

/**
 * Save a validated order. `order` comes from validateCheckout (prices from the database a moment ago);
 * here every price, fee and stock level is checked again under row locks, so nothing can change in between.
 */
export async function placeOrder(sql: Sql, order: ValidOrder, opts: { key: string; ipHash: string | null }): Promise<PlaceResult> {
  if (!UUID.test(opts.key)) return { ok: false, reason: "bad_key" };
  if (order.payment === "card" && !cardPaymentsEnabled()) return { ok: false, reason: "card_unavailable" };

  const replay = await existingOrder(sql, opts.key, order.phone);
  if (replay) return replay;

  if (opts.ipHash) {
    const { max, windowSec } = LIMITS.checkoutPerDevice;
    if (!(await allow(sql, `checkout:${opts.ipHash}`, max, windowSec))) return { ok: false, reason: "rate_limited" };
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await sql.begin(async (tx) => {
        // Customer row: created or updated, and LOCKED until commit, so two orders from the same phone
        // queue behind each other and the per-phone limit below is exact.
        const [customer] = await tx<{ id: number; is_blocked: boolean }[]>`
          INSERT INTO customers (phone, name) VALUES (${order.phone}, ${order.name})
          ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
          RETURNING id, is_blocked`;
        if (customer.is_blocked) throw new Refusal("blocked");

        const [{ recent }] = await tx<{ recent: number }[]>`
          SELECT count(*)::int AS recent FROM orders
          WHERE customer_id = ${customer.id} AND created_at > now() - interval '24 hours'`;
        if (recent >= LIMITS.ordersPerPhonePerDay) throw new Refusal("phone_limit");

        const [area] = await tx<{ id: number; name_en: string; fee: number; cod_allowed: boolean }[]>`
          SELECT a.id, a.name_en, z.fee_piasters AS fee, z.cod_allowed
          FROM shipping_areas a JOIN shipping_zones z ON z.id = a.zone_id
          WHERE a.slug = ${order.area.id} AND a.is_active AND z.is_active`;
        if (!area) throw new Refusal("area_unavailable");
        if (area.fee !== order.shippingPiasters) throw new Refusal("price_changed");
        if (order.payment === "cod" && !area.cod_allowed) throw new Refusal("cod_unavailable");

        // Lock the variants being bought, always in id order (no deadlocks between two buyers).
        const wanted = order.lines.map((l) => `${l.color}|${l.size}`);
        const variants = await tx<VariantRow[]>`
          SELECT v.id, c.code AS color, v.size, coalesce(v.price_override_piasters, p.price_piasters) AS unit,
                 p.name_en AS product_name, c.name_en AS color_name,
                 (v.is_active AND c.is_active AND p.status = 'live') AS sellable
          FROM variants v
          JOIN colorways c ON c.id = v.colorway_id
          JOIN products p ON p.id = c.product_id
          WHERE p.slug = ${PRODUCT_SLUG} AND (c.code || '|' || v.size) IN ${tx(wanted)}
          ORDER BY v.id
          FOR UPDATE OF v`;

        let soldOutNow = false;
        const items = [];
        for (const line of order.lines) {
          const v = variants.find((x) => x.color === line.color && x.size === line.size);
          if (!v || !v.sellable) throw new Refusal("sold_out");
          if (v.unit !== line.unitPiasters) throw new Refusal("price_changed");
          const [left] = await tx<{ tracked: boolean; left: number }[]>`
            UPDATE variants SET stock_reserved = stock_reserved + ${line.qty}
            WHERE id = ${v.id} AND (NOT track_inventory OR stock_on_hand - stock_reserved >= ${line.qty})
            RETURNING track_inventory AS tracked, stock_on_hand - stock_reserved AS left`;
          if (!left) throw new Refusal("sold_out");
          if (left.tracked && left.left === 0) soldOutNow = true;
          items.push({ v, line });
        }

        const subtotal = items.reduce((s, { v, line }) => s + v.unit * line.qty, 0);
        const total = subtotal + area.fee;
        if (total !== order.totalPiasters) throw new Refusal("price_changed");

        const status = order.payment === "cod" ? "CONFIRMATION_NEEDED" : "PENDING_PAYMENT";
        const number = newOrderNumber();
        const [saved] = await tx<{ id: number }[]>`
          INSERT INTO orders (number, customer_id, status, payment_method, area_id, address,
                              subtotal_piasters, shipping_piasters, discount_piasters, total_piasters,
                              idempotency_key, customer_name, customer_phone, area_name, ip_hash)
          VALUES (${number}, ${customer.id}, ${status}, ${order.payment}, ${area.id}, ${order.address},
                  ${subtotal}, ${area.fee}, 0, ${total},
                  ${opts.key}, ${order.name}, ${order.phone}, ${area.name_en}, ${opts.ipHash})
          RETURNING id`;
        for (const { v, line } of items) {
          await tx`
            INSERT INTO order_items (order_id, variant_id, product_name, color_name, size, unit_piasters, qty, line_piasters)
            VALUES (${saved.id}, ${v.id}, ${v.product_name}, ${v.color_name}, ${v.size}, ${v.unit}, ${line.qty}, ${v.unit * line.qty})`;
        }
        await tx`
          INSERT INTO order_events (order_id, type, data)
          VALUES (${saved.id}, 'created', ${tx.json({ source: "web", payment: order.payment, totalPiasters: total, status })})`;

        return { ok: true as const, number, payment: order.payment, existing: false, soldOutNow };
      });
    } catch (err) {
      if (err instanceof Refusal) return { ok: false, reason: err.reason };
      const pg = err as { code?: string; constraint_name?: string };
      if (pg.code === "23505" && pg.constraint_name === "orders_idempotency_key_uq") {
        // Two taps raced; the other one won. Return the order it saved.
        const replay = await existingOrder(sql, opts.key, order.phone);
        if (replay) return replay;
      }
      if (pg.code === "23505" && pg.constraint_name === "orders_number_key") continue; // 1-in-a-billion number clash: new number
      throw err;
    }
  }
  throw new Error("Could not allocate an order number");
}

// ---------- Customer order lookup ----------

export const STATUS_TEXT: Record<string, string> = {
  PENDING_PAYMENT: "Waiting for payment",
  CONFIRMATION_NEEDED: "Received. We'll confirm with you on WhatsApp.",
  CONFIRMED: "Confirmed. We're preparing it.",
  PACKED: "Packed and ready for the courier.",
  WITH_COURIER: "With the courier, on its way to you.",
  DELIVERED: "Delivered.",
  REFUSED_AT_DOOR: "Not accepted at delivery.",
  CANCELLED: "Cancelled.",
  EXPIRED: "Payment was not completed.",
};

export type TrackedOrder = {
  number: string;
  status: string;
  statusText: string;
  payment: "cod" | "card";
  area: string;
  placedAt: string;
  subtotalPiasters: number;
  shippingPiasters: number;
  totalPiasters: number;
  trackingNumber: string | null;
  items: { name: string; color: string; size: string; qty: number; linePiasters: number }[];
};

export const ORDER_NUMBER = /^NUR-[2-9A-HJ-NP-Z]{6}$/;

/** Needs BOTH the order number and the phone used for it. Never says which one was wrong. */
export async function findOrder(sql: Sql, rawNumber: unknown, rawPhone: unknown): Promise<TrackedOrder | null> {
  const number = typeof rawNumber === "string" ? rawNumber.trim().toUpperCase() : "";
  const phone = normalizePhone(rawPhone);
  if (!ORDER_NUMBER.test(number) || !phone) return null;
  const [o] = await sql<
    {
      id: number;
      number: string;
      status: string;
      payment_method: "cod" | "card";
      area_name: string;
      created_at: Date;
      subtotal_piasters: number;
      shipping_piasters: number;
      total_piasters: number;
      tracking_number: string | null;
    }[]
  >`SELECT id, number, status, payment_method, area_name, created_at, subtotal_piasters, shipping_piasters, total_piasters, tracking_number
    FROM orders WHERE number = ${number} AND customer_phone = ${phone}`;
  if (!o) return null;
  const items = await sql<{ product_name: string; color_name: string; size: string; qty: number; line_piasters: number }[]>`
    SELECT product_name, color_name, size, qty, line_piasters FROM order_items WHERE order_id = ${o.id} ORDER BY id`;
  return {
    number: o.number,
    status: o.status,
    statusText: STATUS_TEXT[o.status] ?? o.status,
    payment: o.payment_method,
    area: o.area_name,
    placedAt: o.created_at.toISOString(),
    subtotalPiasters: o.subtotal_piasters,
    shippingPiasters: o.shipping_piasters,
    totalPiasters: o.total_piasters,
    trackingNumber: o.tracking_number,
    items: items.map((i) => ({ name: i.product_name, color: i.color_name, size: i.size, qty: i.qty, linePiasters: i.line_piasters })),
  };
}
