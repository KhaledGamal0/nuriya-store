// Integration tests against a real Postgres (CI starts one). Skipped when DATABASE_URL is not set.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
const skip = !url ? "DATABASE_URL not set" : false;
const sql = url ? postgres(url, { max: 1, onnotice: () => {} }) : null;

after(async () => {
  await sql?.end();
  const { getDb } = await import("../lib/db/index.ts");
  if (url) await (getDb() as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

test("seed created the catalog and all delivery areas", { skip }, async () => {
  const [c] = await sql!`
    SELECT (SELECT count(*) FROM products)::int AS products, (SELECT count(*) FROM colorways)::int AS colorways,
           (SELECT count(*) FROM variants)::int AS variants, (SELECT count(*) FROM shipping_areas)::int AS areas,
           (SELECT count(*) FROM media)::int AS media`;
  assert.deepEqual({ ...c }, { products: 1, colorways: 2, variants: 4, areas: 35, media: 10 });
});

test("storefront reads price, photos and fees from the database", { skip }, async () => {
  const { getCatalog, getAreas } = await import("../lib/store.ts");
  const catalog = await getCatalog();
  assert.equal(catalog.pricePiasters, 120_000);
  assert.equal(catalog.colors.cream.images.length, 4);
  assert.equal(catalog.colors.burgundy.images.length, 6);
  assert.ok(catalog.colors.cream.sizes.every((s) => s.available));
  const areas = await getAreas();
  assert.equal(areas.length, 35);
  assert.equal(areas.find((a) => a.id === "alexandria")?.feePiasters, 9_000);
});

test("a price change in the database is what checkout charges", { skip }, async () => {
  const { getCatalog, getAreas } = await import("../lib/store.ts");
  const { validateCheckout } = await import("../lib/checkout.ts");
  await sql!`UPDATE products SET price_piasters = 125000 WHERE slug = 'quiet-confidence'`;
  try {
    const r = validateCheckout(
      { phone: "01012345678", name: "Nour Ahmed", areaId: "cairo", address: "12 Tahrir St, floor 2", payment: "cod", cart: [{ color: "burgundy", size: "L/XL", qty: 2 }] },
      { catalog: await getCatalog(), areas: await getAreas() },
    );
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.order.totalPiasters, 2 * 125_000 + 7_500);
  } finally {
    await sql!`UPDATE products SET price_piasters = 120000 WHERE slug = 'quiet-confidence'`;
  }
});

test("a size with no stock shows sold out and cannot be ordered", { skip }, async () => {
  const { getCatalog, getAreas } = await import("../lib/store.ts");
  const { validateCheckout } = await import("../lib/checkout.ts");
  await sql!`UPDATE variants SET track_inventory = true, stock_on_hand = 0 WHERE sku = 'NUR-QC-CRM-SM'`;
  try {
    const catalog = await getCatalog();
    assert.equal(catalog.colors.cream.sizes.find((s) => s.size === "S/M")?.available, false);
    assert.equal(catalog.colors.cream.sizes.find((s) => s.size === "L/XL")?.available, true);
    const r = validateCheckout(
      { phone: "01012345678", name: "Nour Ahmed", areaId: "cairo", address: "12 Tahrir St, floor 2", payment: "cod", cart: [{ color: "cream", size: "S/M", qty: 1 }] },
      { catalog, areas: await getAreas() },
    );
    assert.equal(r.ok, false);
  } finally {
    await sql!`UPDATE variants SET track_inventory = false, stock_on_hand = 0 WHERE sku = 'NUR-QC-CRM-SM'`;
  }
});

test("a deactivated delivery area disappears from checkout", { skip }, async () => {
  const { getAreas } = await import("../lib/store.ts");
  await sql!`UPDATE shipping_areas SET is_active = false WHERE slug = 'aswan'`;
  try {
    assert.equal((await getAreas()).some((a) => a.id === "aswan"), false);
  } finally {
    await sql!`UPDATE shipping_areas SET is_active = true WHERE slug = 'aswan'`;
  }
});

test("the database itself refuses bad data", { skip }, async () => {
  await assert.rejects(sql!`UPDATE variants SET stock_on_hand = -1 WHERE sku = 'NUR-QC-CRM-SM'`, /check/i);
  await assert.rejects(sql!`UPDATE products SET price_piasters = 0`, /check/i);
  await assert.rejects(sql!`INSERT INTO customers (phone, name) VALUES ('0123', 'x')`, /check/i);
  const [cust] = await sql!`INSERT INTO customers (phone, name) VALUES ('01099999999', 'Test') RETURNING id`;
  const [area] = await sql!`SELECT id FROM shipping_areas WHERE slug = 'cairo'`;
  try {
    // total must equal subtotal + shipping - discount
    await assert.rejects(
      sql!`INSERT INTO orders (number, customer_id, status, payment_method, area_id, address, subtotal_piasters, shipping_piasters, total_piasters)
           VALUES ('NUR-TEST01', ${cust!.id}, 'CONFIRMATION_NEEDED', 'cod', ${area!.id}, 'x', 120000, 7500, 100)`,
      /check/i,
    );
    await assert.rejects(
      sql!`INSERT INTO orders (number, customer_id, status, payment_method, area_id, address, subtotal_piasters, shipping_piasters, total_piasters)
           VALUES ('NUR-TEST02', ${cust!.id}, 'SHIPPED_SOMEWHERE', 'cod', ${area!.id}, 'x', 120000, 7500, 127500)`,
      /check/i,
    );
  } finally {
    await sql!`DELETE FROM customers WHERE id = ${cust!.id}`;
  }
});

test("seeding twice changes nothing", { skip }, async () => {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, ["--experimental-strip-types", "scripts/db-seed.ts"], { env: process.env, stdio: "ignore" });
  const [c] = await sql!`SELECT (SELECT count(*) FROM variants)::int AS v, (SELECT count(*) FROM media)::int AS m, (SELECT count(*) FROM shipping_areas)::int AS a`;
  assert.deepEqual({ ...c }, { v: 4, m: 11, a: 35 });
});
