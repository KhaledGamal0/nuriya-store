import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCheckout, normalizePhone, parseCart, newOrderNumber } from "../lib/checkout.ts";
import { AREAS, getArea } from "../lib/shipping.ts";
import { formatEgp } from "../lib/money.ts";
import { sizeForWeight } from "../lib/catalog.ts";

const good = {
  phone: "010 1234 5678",
  name: "Nour Ahmed",
  areaId: "alexandria",
  address: "12 El Horreya Rd, building 4, floor 3",
  payment: "cod",
  cart: JSON.stringify([{ color: "cream", size: "S/M", qty: 1 }]),
};

test("valid order is priced on the server", () => {
  const r = validateCheckout(good);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.order.subtotalPiasters, 100_000); // launch offer: 1,000 EGP
  assert.equal(r.order.shippingPiasters, 9_000);
  assert.equal(r.order.totalPiasters, 109_000);
  assert.equal(r.order.phone, "01012345678");
});

test("a price sent by the browser is ignored", () => {
  const r = validateCheckout({ ...good, cart: JSON.stringify([{ color: "cream", size: "S/M", qty: 1, price: 1 }]) });
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.order.totalPiasters, 109_000);
});

test("unknown color, size or area is rejected", () => {
  assert.equal(validateCheckout({ ...good, cart: JSON.stringify([{ color: "gold", size: "S/M", qty: 1 }]) }).ok, false);
  assert.equal(validateCheckout({ ...good, cart: JSON.stringify([{ color: "cream", size: "XXL", qty: 1 }]) }).ok, false);
  assert.equal(validateCheckout({ ...good, areaId: "atlantis" }).ok, false);
});

test("quantities are merged and capped", () => {
  const lines = parseCart([{ color: "cream", size: "S/M", qty: 4 }, { color: "cream", size: "S/M", qty: 4 }]);
  assert.deepEqual(lines, [{ color: "cream", size: "S/M", qty: 5 }]);
  assert.equal(parseCart([{ color: "cream", size: "S/M", qty: 0 }]), null);
  assert.equal(parseCart("not json"), null);
  assert.equal(parseCart([]), null);
});

test("Egyptian mobile numbers", () => {
  assert.equal(normalizePhone("+20 115 555 1234"), "01155551234");
  assert.equal(normalizePhone("0020-122-555-1234"), "01225551234");
  assert.equal(normalizePhone("01512345678"), "01512345678");
  assert.equal(normalizePhone("01312345678"), null);
  assert.equal(normalizePhone("0101234567"), null);
});

test("errors name every bad field", () => {
  const r = validateCheckout({ phone: "123", name: "", areaId: "", address: "", payment: "x", cart: "[]" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["address", "area", "cart", "name", "payment", "phone"]);
});

test("shipping table matches the Direction price list", () => {
  assert.equal(getArea("cairo")?.feePiasters, 7_500);
  assert.equal(getArea("sharm-el-sheikh")?.feePiasters, 16_500);
  assert.equal(getArea("new-administrative-capital")?.feePiasters, 13_500);
  assert.equal(AREAS.length, 35);
  assert.equal(new Set(AREAS.map((a) => a.id)).size, AREAS.length);
});

test("money and size helpers", () => {
  assert.equal(formatEgp(120_000), "1,200 EGP");
  assert.equal(sizeForWeight(65).size, "S/M");
  assert.equal(sizeForWeight(66).size, "L/XL");
  assert.match(newOrderNumber(), /^NUR-[2-9A-HJ-NP-Z]{6}$/);
});

import { staticCatalog } from "../lib/catalog.ts";

function ctxWith(mutate: (c: ReturnType<typeof staticCatalog>) => void) {
  const catalog = staticCatalog();
  mutate(catalog);
  return { catalog, areas: AREAS };
}

test("a sold-out size cannot be ordered", () => {
  const ctx = ctxWith((c) => {
    c.colors.cream = { ...c.colors.cream, sizes: c.colors.cream.sizes.map((s) => (s.size === "S/M" ? { ...s, available: false } : s)) };
  });
  const r = validateCheckout(good, ctx);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.errors.cart ?? "", /sold out/);
});

test("the price comes from the store data, not a constant", () => {
  const ctx = ctxWith((c) => {
    c.colors.cream = { ...c.colors.cream, sizes: c.colors.cream.sizes.map((s) => ({ ...s, pricePiasters: 99_900 })) };
  });
  const r = validateCheckout(good, ctx);
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.order.totalPiasters, 99_900 + 9_000);
});

test("an area that is not active is rejected", () => {
  const r = validateCheckout(good, { catalog: staticCatalog(), areas: AREAS.filter((a) => a.id !== "alexandria") });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.area);
});
