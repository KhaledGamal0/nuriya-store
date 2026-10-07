// Crowd tests against a real Postgres: hundreds of orders at the same moment. After every storm the
// books must balance exactly — no lost order, no duplicate, no overselling, no half-saved order.
// Test phones use 0108… and are deleted afterwards. Skipped when DATABASE_URL is not set.
import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL;
const skip = !url ? "DATABASE_URL not set" : false;
const sql = url ? postgres(url, { max: 4, onnotice: () => {} }) : null;

const phone = (i: number) => `0108${String(i).padStart(7, "0")}`;

async function cleanup() {
  await sql!`DELETE FROM orders WHERE customer_phone LIKE '0108%'`;
  await sql!`DELETE FROM customers WHERE phone LIKE '0108%'`;
  await sql!`DELETE FROM rate_limits`;
  await sql!`UPDATE variants SET track_inventory = false, stock_on_hand = 0, stock_reserved = 0`;
}

beforeEach(async () => {
  if (url) await cleanup();
});

after(async () => {
  if (!url) return;
  await cleanup();
  await sql!.end();
  const { getSql } = await import("../lib/db/index.ts");
  await getSql().end();
});

async function ctx() {
  const { getCatalog, getAreas } = await import("../lib/store.ts");
  return { catalog: await getCatalog(), areas: await getAreas() };
}

async function order(p: string, cart: unknown, c: Awaited<ReturnType<typeof ctx>>) {
  const { validateCheckout } = await import("../lib/checkout.ts");
  const r = validateCheckout({ phone: p, name: "Load Test", areaId: "cairo", address: "1 Load Test St, floor 2", payment: "cod", cart }, c);
  assert.ok(r.ok);
  return r.order;
}

/** Run tasks with at most `limit` in flight. */
async function pool<T>(items: readonly (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out: T[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await items[i]!();
      }
    }),
  );
  return out;
}

async function books() {
  const [b] = await sql!`
    SELECT
      (SELECT count(*)::int FROM orders WHERE customer_phone LIKE '0108%') AS orders,
      (SELECT count(DISTINCT number)::int FROM orders WHERE customer_phone LIKE '0108%') AS numbers,
      (SELECT count(*)::int FROM orders o WHERE customer_phone LIKE '0108%' AND NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id)) AS without_items,
      (SELECT count(*)::int FROM orders o WHERE customer_phone LIKE '0108%' AND NOT EXISTS (SELECT 1 FROM order_events e WHERE e.order_id = o.id AND e.type = 'created')) AS without_history,
      (SELECT count(*)::int FROM orders o WHERE customer_phone LIKE '0108%' AND o.subtotal_piasters <> (SELECT sum(line_piasters) FROM order_items i WHERE i.order_id = o.id)) AS wrong_subtotal`;
  return b!;
}

test("200 shoppers ordering at once (40 at a time): every order saved once, complete and correct", { skip }, async () => {
  const { placeOrder } = await import("../lib/orders.ts");
  const { getSql } = await import("../lib/db/index.ts");
  const c = await ctx();
  const t0 = Date.now();
  const results = await pool(
    Array.from({ length: 200 }, (_, i) => async () =>
      placeOrder(getSql(), await order(phone(i), [{ color: i % 2 ? "cream" : "burgundy", size: i % 3 ? "S/M" : "L/XL", qty: 1 + (i % 3) }], c), { key: randomUUID(), ipHash: null }),
    ),
    40,
  );
  const ms = Date.now() - t0;
  assert.equal(results.filter((r) => r.ok).length, 200, JSON.stringify(results.find((r) => !r.ok)));
  const b = await books();
  assert.deepEqual({ ...b }, { orders: 200, numbers: 200, without_items: 0, without_history: 0, wrong_subtotal: 0 });
  console.log(`# 200 orders saved in ${ms} ms (${Math.round((200 / ms) * 1000)} orders/s)`);
});

test("60 buyers race for 25 pieces: exactly the stock is sold, never more", { skip }, async () => {
  const { placeOrder } = await import("../lib/orders.ts");
  const { getSql } = await import("../lib/db/index.ts");
  await sql!`UPDATE variants SET track_inventory = true, stock_on_hand = 25, stock_reserved = 0 WHERE sku = 'NUR-QC-CRM-SM'`;
  const c = await ctx();
  const wants = Array.from({ length: 60 }, (_, i) => 1 + (i % 2)); // 1 or 2 pieces each
  const prepared = await Promise.all(wants.map((q, i) => order(phone(1000 + i), [{ color: "cream", size: "S/M", qty: q }], c)));
  const results = await Promise.all(prepared.map((o) => placeOrder(getSql(), o, { key: randomUUID(), ipHash: null })));
  const sold = results.reduce((n, r, i) => n + (r.ok ? wants[i]! : 0), 0);
  assert.ok(results.every((r) => r.ok || r.reason === "sold_out"), "the only refusal is sold out");
  assert.ok(sold <= 25 && sold >= 24, `sold ${sold} of 25`); // 24 when the last buyer wanted 2 with 1 left
  const [v] = await sql!`SELECT stock_on_hand FROM variants WHERE sku = 'NUR-QC-CRM-SM'`;
  assert.equal(v!.stock_on_hand, 25 - sold, "stock went down by exactly what the saved orders contain");
  const [{ q } = { q: -1 }] = await sql!`SELECT coalesce(sum(i.qty), 0)::int AS q FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.customer_phone LIKE '0108%'`;
  assert.equal(q, sold);
});

test("one phone hammering checkout 15 times at once gets exactly 3 orders", { skip }, async () => {
  const { placeOrder } = await import("../lib/orders.ts");
  const { getSql } = await import("../lib/db/index.ts");
  const o = await order(phone(5000), [{ color: "cream", size: "S/M", qty: 1 }], await ctx());
  const results = await Promise.all(Array.from({ length: 15 }, () => placeOrder(getSql(), o, { key: randomUUID(), ipHash: null })));
  assert.equal(results.filter((r) => r.ok).length, 3);
  assert.equal((await books()).orders, 3);
});

test("one device firing 10 more orders than allowed, all at once, gets exactly the limit through", { skip }, async () => {
  const { placeOrder, LIMITS } = await import("../lib/orders.ts");
  const { getSql } = await import("../lib/db/index.ts");
  const c = await ctx();
  const prepared = await Promise.all(Array.from({ length: LIMITS.checkoutPerDevice.max + 10 }, (_, i) => order(phone(6000 + i), [{ color: "cream", size: "S/M", qty: 1 }], c)));
  const results = await Promise.all(prepared.map((o) => placeOrder(getSql(), o, { key: randomUUID(), ipHash: "same-device" })));
  assert.equal(results.filter((r) => r.ok).length, LIMITS.checkoutPerDevice.max);
  assert.ok(results.filter((r) => !r.ok).every((r) => !r.ok && r.reason === "rate_limited"));
});

test("20 retries of the same checkout at once (bad network) create one order", { skip }, async () => {
  const { placeOrder } = await import("../lib/orders.ts");
  const { getSql } = await import("../lib/db/index.ts");
  const o = await order(phone(7000), [{ color: "burgundy", size: "L/XL", qty: 2 }], await ctx());
  const key = randomUUID();
  const results = await Promise.all(Array.from({ length: 20 }, () => placeOrder(getSql(), o, { key, ipHash: null })));
  assert.ok(results.every((r) => r.ok));
  assert.equal(new Set(results.map((r) => r.ok && r.number)).size, 1);
  assert.equal((await books()).orders, 1);
});
