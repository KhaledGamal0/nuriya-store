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
  assert.equal(AREAS.length, 28);
  assert.equal(getArea("cairo")?.nameEn, "Cairo & Giza");
  assert.equal(getArea("sheikh-zayed"), undefined, "new cities are part of Cairo & Giza");
  assert.equal(new Set(AREAS.map((a) => a.id)).size, AREAS.length);
  // Every fee, checked against the Direction price list image.
  const fees: Record<string, number> = {
    "giza-countryside": 90, alexandria: 90, beheira: 90, gharbia: 90, dakahlia: 90, qalyubia: 90, "kafr-el-sheikh": 90,
    monufia: 90, ismailia: 90, suez: 90, "port-said": 90, damietta: 90, sharqia: 90, fayoum: 100, "beni-suef": 100,
    minya: 105, assiut: 105, sohag: 105, qena: 105, luxor: 105, aswan: 105, "new-valley": 125,
    "red-sea-hurghada": 165, "north-coast": 165, "marsa-matrouh": 165,
  };
  for (const [id, egp] of Object.entries(fees)) assert.equal(getArea(id)?.feePiasters, egp * 100, id);
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

test("phone input is grouped as typed, Arabic digits and +20 included", async () => {
  const { formatPhoneInput } = await import("../lib/checkout.ts");
  assert.equal(formatPhoneInput("01012345678"), "010 1234 5678");
  assert.equal(formatPhoneInput("0101"), "010 1");
  assert.equal(formatPhoneInput("+201012345678"), "010 1234 5678");
  assert.equal(formatPhoneInput("٠١٠١٢٣٤٥٦٧٨"), "010 1234 5678");
  assert.equal(formatPhoneInput("010-1234-56789999"), "010 1234 5678", "never more than 11 digits");
  assert.equal(formatPhoneInput("abc"), "");
});

test("second number is optional, must be valid, and different from the main one", () => {
  const ok = validateCheckout({ ...good, phone2: "" });
  assert.ok(ok.ok && ok.order.altPhone === null);
  const two = validateCheckout({ ...good, phone2: "0122 333 4444" });
  assert.ok(two.ok && two.order.altPhone === "01223334444");
  const bad = validateCheckout({ ...good, phone2: "0123" });
  assert.ok(!bad.ok && bad.errors.phone2);
  const same = validateCheckout({ ...good, phone2: good.phone as string });
  assert.ok(!same.ok && same.errors.phone2?.includes("same"));
});
