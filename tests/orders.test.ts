// Order safety tests against a real Postgres (CI starts one). Skipped when DATABASE_URL is not set.
// Every rule that protects money, stock or customers has a test here. Test phones use the 0109… range
// and are deleted afterwards.
import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL;
const skip = !url ? "DATABASE_URL not set" : false;
const sql = url ? postgres(url, { max: 4, onnotice: () => {} }) : null;

let phoneSeq = 0;
const nextPhone = () => `0109${String(Date.now() % 10000).padStart(4, "0")}${String(phoneSeq++).padStart(3, "0")}`.slice(0, 11);

async function cleanup() {
  await sql!`DELETE FROM orders WHERE customer_phone LIKE '0109%'`;
  await sql!`DELETE FROM customers WHERE phone LIKE '0109%'`;
  await sql!`DELETE FROM rate_limits`;
  await sql!`UPDATE variants SET track_inventory = false, stock_on_hand = 0, stock_reserved = 0, is_active = true`;
  await sql!`UPDATE products SET price_piasters = 120000 WHERE slug = 'quiet-confidence'`;
  await sql!`UPDATE shipping_areas SET is_active = true`;
  await sql!`UPDATE shipping_zones SET is_active = true, cod_allowed = true`;
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

/** Destructuring default for rows a test expects to exist. */
function noRow(): never {
  throw new Error("expected a database row");
}

type Cart = { color: string; size: string; qty: number; price?: number }[];

async function valid(phone: string, cart: Cart = [{ color: "cream", size: "S/M", qty: 1 }], areaId = "alexandria", payment = "cod") {
  const { getCatalog, getAreas } = await import("../lib/store.ts");
  const { validateCheckout } = await import("../lib/checkout.ts");
  const r = validateCheckout(
    { phone, name: "Nour Ahmed", areaId, address: "12 El Horreya Rd, building 4, floor 3", payment, cart },
    { catalog: await getCatalog(), areas: await getAreas() },
  );
  assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
  return r.order;
}

async function place(order: Awaited<ReturnType<typeof valid>>, key: string = randomUUID(), ipHash: string | null = null) {
  const { placeOrder } = await import("../lib/orders.ts");
  const { getSql } = await import("../lib/db/index.ts");
  return placeOrder(getSql(), order, { key, ipHash });
}

test("a COD order is saved with items, customer and history, priced from the database", { skip }, async () => {
  const phone = nextPhone();
  const r = await place(await valid(phone, [{ color: "burgundy", size: "L/XL", qty: 2 }]));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.match(r.number, /^NUR-[2-9A-HJ-NP-Z]{6}$/);
  const [o = noRow()] = await sql!`SELECT * FROM orders WHERE number = ${r.number}`;
  assert.equal(o.status, "CONFIRMATION_NEEDED");
  assert.equal(o.payment_method, "cod");
  assert.equal(o.payment_status, "UNPAID");
  assert.equal(o.subtotal_piasters, 240_000);
  assert.equal(o.shipping_piasters, 9_000);
  assert.equal(o.total_piasters, 249_000);
  assert.equal(o.customer_phone, phone);
  assert.equal(o.area_name, "Alexandria");
  assert.equal(o.notified_at, null);
  const items = await sql!`SELECT * FROM order_items WHERE order_id = ${o.id}`;
  assert.equal(items.length, 1);
  const [item = noRow()] = items;
  assert.deepEqual([item.color_name, item.size, item.qty, item.unit_piasters], ["Burgundy", "L/XL", 2, 120_000]);
  const events = await sql!`SELECT type FROM order_events WHERE order_id = ${o.id}`;
  assert.deepEqual(events.map((e) => e.type), ["created"]);
  const [c = noRow()] = await sql!`SELECT name FROM customers WHERE phone = ${phone}`;
  assert.equal(c.name, "Nour Ahmed");
});

test("a price sent by the browser never reaches the database", { skip }, async () => {
  const r = await place(await valid(nextPhone(), [{ color: "cream", size: "S/M", qty: 1, price: 1 }]));
  assert.ok(r.ok);
  if (!r.ok) return;
  const [o = noRow()] = await sql!`SELECT total_piasters FROM orders WHERE number = ${r.number}`;
  assert.equal(o.total_piasters, 120_000 + 9_000);
});

test("the same checkout sent twice creates one order", { skip }, async () => {
  const phone = nextPhone();
  const order = await valid(phone);
  const key = randomUUID();
  const a = await place(order, key);
  const b = await place(order, key);
  assert.ok(a.ok && b.ok);
  if (!a.ok || !b.ok) return;
  assert.equal(a.number, b.number);
  assert.equal(b.existing, true);
  const [{ n } = noRow()] = await sql!`SELECT count(*)::int AS n FROM orders WHERE customer_phone = ${phone}`;
  assert.equal(n, 1);
});

test("two taps at the same moment create one order", { skip }, async () => {
  const phone = nextPhone();
  const order = await valid(phone);
  const key = randomUUID();
  const results = await Promise.all([place(order, key), place(order, key), place(order, key)]);
  assert.ok(results.every((r) => r.ok));
  const numbers = new Set(results.map((r) => (r.ok ? r.number : "")));
  assert.equal(numbers.size, 1);
  const [{ n } = noRow()] = await sql!`SELECT count(*)::int AS n FROM orders WHERE customer_phone = ${phone}`;
  assert.equal(n, 1);
});

test("a key reused with another phone is refused", { skip }, async () => {
  const key = randomUUID();
  assert.ok((await place(await valid(nextPhone()), key)).ok);
  const r = await place(await valid(nextPhone()), key);
  assert.deepEqual(r, { ok: false, reason: "bad_key" });
});

test("two buyers cannot both get the last piece", { skip }, async () => {
  await sql!`UPDATE variants SET track_inventory = true, stock_on_hand = 1, stock_reserved = 0 WHERE sku = 'NUR-QC-CRM-SM'`;
  const [a, b] = await Promise.all([valid(nextPhone()), valid(nextPhone())]);
  const results = await Promise.all([place(a), place(b)]);
  const won = results.filter((r) => r.ok);
  const lost = results.filter((r) => !r.ok);
  assert.equal(won.length, 1);
  assert.deepEqual(lost, [{ ok: false, reason: "sold_out" }]);
  const [winner = noRow()] = won;
  assert.equal(winner.ok && winner.soldOutNow, true);
  const [v = noRow()] = await sql!`SELECT stock_on_hand, stock_reserved FROM variants WHERE sku = 'NUR-QC-CRM-SM'`;
  assert.deepEqual({ ...v }, { stock_on_hand: 1, stock_reserved: 1 });
});

test("a refused order leaves no trace: no order, no reservation", { skip }, async () => {
  await sql!`UPDATE variants SET track_inventory = true, stock_on_hand = 5, stock_reserved = 0 WHERE sku = 'NUR-QC-CRM-SM'`;
  await sql!`UPDATE variants SET track_inventory = true, stock_on_hand = 0, stock_reserved = 0 WHERE sku = 'NUR-QC-BRG-LXL'`;
  const phone = nextPhone();
  const { getCatalog, getAreas } = await import("../lib/store.ts");
  const { validateCheckout } = await import("../lib/checkout.ts");
  // Validated while both were in stock (stale view), then one sold out before saving.
  await sql!`UPDATE variants SET stock_on_hand = 3 WHERE sku = 'NUR-QC-BRG-LXL'`;
  const r0 = validateCheckout(
    { phone, name: "Nour Ahmed", areaId: "cairo", address: "12 Tahrir St, floor 2", payment: "cod", cart: [{ color: "cream", size: "S/M", qty: 2 }, { color: "burgundy", size: "L/XL", qty: 1 }] },
    { catalog: await getCatalog(), areas: await getAreas() },
  );
  assert.ok(r0.ok);
  if (!r0.ok) return;
  await sql!`UPDATE variants SET stock_on_hand = 0 WHERE sku = 'NUR-QC-BRG-LXL'`;
  const r = await place(r0.order);
  assert.deepEqual(r, { ok: false, reason: "sold_out" });
  const [v = noRow()] = await sql!`SELECT stock_reserved FROM variants WHERE sku = 'NUR-QC-CRM-SM'`;
  assert.equal(v.stock_reserved, 0, "the cream reservation must be rolled back");
  const [{ n } = noRow()] = await sql!`SELECT count(*)::int AS n FROM orders WHERE customer_phone = ${phone}`;
  assert.equal(n, 0);
});

test("a price change between viewing and ordering is refused, never charged silently", { skip }, async () => {
  const phone = nextPhone();
  const order = await valid(phone); // priced at 1,200
  await sql!`UPDATE products SET price_piasters = 125000 WHERE slug = 'quiet-confidence'`;
  assert.deepEqual(await place(order), { ok: false, reason: "price_changed" });
  const [{ n } = noRow()] = await sql!`SELECT count(*)::int AS n FROM orders WHERE customer_phone = ${phone}`;
  assert.equal(n, 0);
});

test("a delivery fee change or a closed area during checkout is refused", { skip }, async () => {
  const order = await valid(nextPhone());
  await sql!`UPDATE shipping_zones SET fee_piasters = fee_piasters + 500 WHERE id = (SELECT zone_id FROM shipping_areas WHERE slug = 'alexandria')`;
  try {
    assert.deepEqual(await place(order), { ok: false, reason: "price_changed" });
  } finally {
    await sql!`UPDATE shipping_zones SET fee_piasters = fee_piasters - 500 WHERE id = (SELECT zone_id FROM shipping_areas WHERE slug = 'alexandria')`;
  }
  const order2 = await valid(nextPhone());
  await sql!`UPDATE shipping_areas SET is_active = false WHERE slug = 'alexandria'`;
  assert.deepEqual(await place(order2), { ok: false, reason: "area_unavailable" });
});

test("cash on delivery is refused where the courier doesn't allow it", { skip }, async () => {
  const order = await valid(nextPhone());
  await sql!`UPDATE shipping_zones SET cod_allowed = false WHERE id = (SELECT zone_id FROM shipping_areas WHERE slug = 'alexandria')`;
  assert.deepEqual(await place(order), { ok: false, reason: "cod_unavailable" });
});

test("card orders are refused until Paymob is connected", { skip }, async () => {
  const order = await valid(nextPhone(), undefined, "alexandria", "card");
  assert.deepEqual(await place(order), { ok: false, reason: "card_unavailable" });
});

test("a blocked phone cannot order", { skip }, async () => {
  const phone = nextPhone();
  await sql!`INSERT INTO customers (phone, name, is_blocked) VALUES (${phone}, 'Blocked Buyer', true)`;
  assert.deepEqual(await place(await valid(phone)), { ok: false, reason: "blocked" });
});

test("one phone can place at most 3 orders a day, even all at once", { skip }, async () => {
  const phone = nextPhone();
  const order = await valid(phone);
  const results = await Promise.all([1, 2, 3, 4, 5].map(() => place(order)));
  assert.equal(results.filter((r) => r.ok).length, 3);
  assert.ok(results.filter((r) => !r.ok).every((r) => !r.ok && r.reason === "phone_limit"));
});

test("too many checkout attempts from one device are slowed down", { skip }, async () => {
  const { LIMITS } = await import("../lib/orders.ts");
  const ip = "test-device-hash";
  const outcomes = [];
  for (let i = 0; i < LIMITS.checkoutPerDevice.max + 1; i++) {
    const r = await place(await valid(nextPhone()), randomUUID(), ip);
    outcomes.push(r.ok ? "ok" : r.reason);
  }
  assert.equal(outcomes.filter((o) => o === "ok").length, LIMITS.checkoutPerDevice.max);
  assert.equal(outcomes.at(-1), "rate_limited");
});

test("a malformed key is refused", { skip }, async () => {
  assert.deepEqual(await place(await valid(nextPhone()), "not-a-uuid"), { ok: false, reason: "bad_key" });
});

test("order lookup needs the right number AND phone, and says the same thing otherwise", { skip }, async () => {
  const { findOrder } = await import("../lib/orders.ts");
  const { getSql } = await import("../lib/db/index.ts");
  const phone = nextPhone();
  const r = await place(await valid(phone));
  assert.ok(r.ok);
  if (!r.ok) return;
  const found = await findOrder(getSql(), r.number.toLowerCase(), `+2${phone}`);
  assert.equal(found?.number, r.number);
  assert.equal(found?.totalPiasters, 129_000);
  assert.match(found!.statusText, /confirm/i);
  assert.equal(JSON.stringify(found).includes("Horreya"), false, "lookup must not reveal the address");
  assert.equal(await findOrder(getSql(), r.number, "01000000000"), null);
  assert.equal(await findOrder(getSql(), "NUR-ZZZZZZ", phone), null);
  assert.equal(await findOrder(getSql(), "' OR 1=1 --", phone), null);
});

test("order e-mail: sent once, retried after a failure, and never blocks or loses the order", { skip }, async () => {
  const { sendPendingOrderEmails } = await import("../lib/notify.ts");
  const { getSql } = await import("../lib/db/index.ts");
  process.env.RESEND_API_KEY = "re_test";
  process.env.ORDER_ALERT_EMAIL = "shop@example.com";
  try {
    const r = await place(await valid(nextPhone()));
    assert.ok(r.ok);
    if (!r.ok) return;
    const calls: { body: string }[] = [];
    const down = (async () => new Response("down", { status: 500 })) as typeof fetch;
    const upAndRecord = (async (_u: string, init: RequestInit) => {
      calls.push({ body: String(init.body) });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    assert.deepEqual(await sendPendingOrderEmails(getSql(), { fetcher: down }), { sent: 0, failed: 1 });
    let [o = noRow()] = await sql!`SELECT notified_at, notify_attempts FROM orders WHERE number = ${r.number}`;
    assert.equal(o.notified_at, null);
    assert.equal(o.notify_attempts, 1);

    assert.deepEqual(await sendPendingOrderEmails(getSql(), { fetcher: upAndRecord }), { sent: 1, failed: 0 });
    [o = noRow()] = await sql!`SELECT notified_at FROM orders WHERE number = ${r.number}`;
    assert.ok(o.notified_at);
    const [call = noRow()] = calls;
    const mail = JSON.parse(call.body);
    assert.match(mail.subject, new RegExp(r.number));
    assert.match(mail.text, /1,290 EGP/);
    assert.match(mail.text, /wa\.me\/20109/);

    // Nothing left to send: no duplicate e-mail.
    assert.deepEqual(await sendPendingOrderEmails(getSql(), { fetcher: upAndRecord }), { sent: 0, failed: 0 });
    assert.equal(calls.length, 1);
  } finally {
    delete process.env.RESEND_API_KEY;
    delete process.env.ORDER_ALERT_EMAIL;
  }
});

test("the database refuses an order whose total doesn't add up or a reservation above stock", { skip }, async () => {
  const phone = nextPhone();
  const [c = noRow()] = await sql!`INSERT INTO customers (phone, name) VALUES (${phone}, 'Check Constraint') RETURNING id`;
  const [a = noRow()] = await sql!`SELECT id FROM shipping_areas WHERE slug = 'cairo'`;
  await assert.rejects(sql!`
    INSERT INTO orders (number, customer_id, status, payment_method, area_id, address, subtotal_piasters, shipping_piasters, total_piasters, customer_phone)
    VALUES ('NUR-TEST22', ${c.id}, 'CONFIRMATION_NEEDED', 'cod', ${a.id}, 'x', 120000, 7500, 1, ${phone})`);
  await assert.rejects(sql!`UPDATE variants SET track_inventory = true, stock_on_hand = 1, stock_reserved = 2 WHERE sku = 'NUR-QC-CRM-SM'`);
});
