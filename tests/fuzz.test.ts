// Robots and garbage: thousands of random and malicious inputs against every checkout rule.
// No database needed. The random generator is seeded, so any failure can be replayed exactly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanText, normalizePhone, parseCart, validateCheckout, MAX_LINES, MAX_QTY_PER_LINE } from "../lib/checkout.ts";
import { staticCatalog, priceFor } from "../lib/catalog.ts";
import { AREAS } from "../lib/shipping.ts";
import { orderEmail, whatsappLink } from "../lib/notify.ts";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const NASTY = [
  "' OR 1=1 --",
  "'; DROP TABLE orders; --",
  "<script>alert(1)</script>",
  '"><img src=x onerror=alert(1)>',
  "javascript:alert(1)",
  "{{7*7}}${7*7}",
  "\u0000\u0000NUL",
  "‮evil RTL override",
  "zero​width​space",
  "a".repeat(100_000),
  "🙂".repeat(500),
  "نور أحمد",
  "١٢ شارع الحرية، الدور ٣",
  "   ",
  "\n\n\t",
  "__proto__",
  "constructor",
  "%00%0d%0a",
  "../../etc/passwd",
];

test("phone: every format an Egyptian customer might type is accepted, junk is not", () => {
  for (const ok of ["01012345678", "010 1234 5678", "010-1234-5678", "(010) 1234 5678", "+201012345678", "00201012345678", "201012345678", "٠١٠١٢٣٤٥٦٧٨", "۰۱۰۱۲۳۴۵۶۷۸", "٠١٠ ١٢٣٤ ٥٦٧٨", "‎01012345678"]) {
    assert.equal(normalizePhone(ok), "01012345678", ok);
  }
  for (const ok of ["01112345678", "01212345678", "01512345678"]) assert.equal(normalizePhone(ok), ok);
  for (const bad of ["0101234567", "010123456789", "01312345678", "02012345678", "1012345678", "abc", "", "0".repeat(1000), null, undefined, 1012345678, {}, [], "01O12345678", "+1 202 555 0100"]) {
    assert.equal(normalizePhone(bad), null, String(bad));
  }
});

test("text fields: control characters, NUL, invisible overrides and huge input are cleaned", () => {
  for (const s of NASTY) {
    const out = cleanText(s, 300);
    assert.ok(out.length <= 300);
    assert.equal(/[\u0000-\u001F\u007F‪-‮​-‍]/.test(out), false, JSON.stringify(s.slice(0, 20)));
  }
  assert.equal(cleanText("  Nour   \n Ahmed ", 80), "Nour Ahmed");
  assert.equal(cleanText("نور أحمد", 80), "نور أحمد");
});

test("cart: tampered quantities, prices, unknown items, prototype pollution and huge carts are handled", () => {
  assert.deepEqual(parseCart([{ color: "cream", size: "S/M", qty: 999, price: 1 }]), [{ color: "cream", size: "S/M", qty: MAX_QTY_PER_LINE }]);
  for (const bad of [[{ color: "cream", size: "S/M", qty: -1 }], [{ color: "cream", size: "S/M", qty: 1.5 }], [{ color: "cream", size: "S/M", qty: "2" }], [{ color: "gold", size: "S/M", qty: 1 }], [{ color: "cream", size: "XXL", qty: 1 }], [], "not json", "{}", null, 42, Array(MAX_LINES + 1).fill({ color: "cream", size: "S/M", qty: 1 })]) {
    assert.equal(parseCart(bad), null, JSON.stringify(bad)?.slice(0, 60));
  }
  const polluted = parseCart('[{"color":"cream","size":"S/M","qty":1,"__proto__":{"polluted":true}}]');
  assert.ok(polluted);
  assert.equal(({} as Record<string, unknown>).polluted, undefined, "Object prototype must not be polluted");
  // Same item many times is merged and capped, never multiplied.
  assert.deepEqual(parseCart(Array(MAX_LINES).fill({ color: "cream", size: "S/M", qty: 5 })), [{ color: "cream", size: "S/M", qty: MAX_QTY_PER_LINE }]);
});

test("5,000 random checkouts: never crashes, and every accepted order adds up exactly", () => {
  const rand = rng(20261007);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  const catalog = staticCatalog();
  const junk = (): unknown =>
    pick([
      () => pick(NASTY),
      () => Math.floor(rand() * 1e6) - 5e5,
      () => rand(),
      () => null,
      () => undefined,
      () => ({}),
      () => [],
      () => true,
      () => String.fromCharCode(...Array.from({ length: Math.floor(rand() * 40) }, () => Math.floor(rand() * 0xffff))),
    ])();
  let accepted = 0;
  for (let i = 0; i < 5000; i++) {
    const good = rand() < 0.5;
    const lines = Array.from({ length: 1 + Math.floor(rand() * 4) }, () => ({
      color: good || rand() < 0.8 ? pick(["cream", "burgundy"]) : junk(),
      size: good || rand() < 0.8 ? pick(["S/M", "L/XL"]) : junk(),
      qty: good ? 1 + Math.floor(rand() * 7) : junk(),
      price: 1,
    }));
    const input = {
      phone: good ? pick(["01012345678", "+20 115 555 0000", "٠١٢٣٤٥٦٧٨٩٠"]) : junk(),
      name: good ? pick(["Nour Ahmed", "نور أحمد", ...NASTY]) : junk(),
      areaId: good ? pick(AREAS).id : junk(),
      address: good ? pick(["12 El Horreya Rd, building 4, floor 3", "١٢ شارع الحرية، الدور ٣", ...NASTY]) : junk(),
      payment: good ? pick(["cod", "card"]) : junk(),
      cart: rand() < 0.5 ? JSON.stringify(lines) : lines,
    };
    const r = validateCheckout(input);
    if (!r.ok) {
      assert.ok(Object.keys(r.errors).length > 0, "a refusal always says why");
      continue;
    }
    accepted++;
    const o = r.order;
    assert.ok(o.lines.length >= 1 && o.lines.length <= MAX_LINES);
    let sum = 0;
    for (const l of o.lines) {
      assert.ok(Number.isInteger(l.qty) && l.qty >= 1 && l.qty <= MAX_QTY_PER_LINE);
      assert.equal(l.unitPiasters, priceFor(catalog, l.color, l.size), "price always from the catalog");
      assert.equal(l.linePiasters, l.unitPiasters * l.qty);
      sum += l.linePiasters;
    }
    assert.equal(o.subtotalPiasters, sum);
    assert.equal(o.shippingPiasters, o.area.feePiasters);
    assert.equal(o.totalPiasters, sum + o.shippingPiasters);
    assert.match(o.phone, /^01[0125]\d{8}$/);
    assert.ok(o.name.length >= 3 && o.name.length <= 80);
    assert.ok(o.address.length >= 10 && o.address.length <= 300);
  }
  assert.ok(accepted > 500, `the generator should produce plenty of valid orders too (got ${accepted})`);
});

test("order e-mail and WhatsApp link: hostile names and addresses cannot inject HTML or break the link", () => {
  const mail = orderEmail({
    id: 1,
    number: "NUR-TEST22",
    payment_method: "cod",
    customer_name: '<script>alert(1)</script> "Nour"',
    customer_phone: "01012345678",
    area_name: "Cairo",
    address: '"><img src=x onerror=alert(1)>',
    subtotal_piasters: 120000,
    shipping_piasters: 7500,
    total_piasters: 127500,
    created_at: new Date().toISOString(),
    items: [{ product_name: "Quiet Confidence", color_name: "Cream", size: "S/M", qty: 1, line_piasters: 120000 }],
  });
  assert.equal(mail.html.includes("<script>"), false);
  assert.equal(mail.html.includes("<img src=x"), false);
  assert.ok(mail.html.includes("&lt;script&gt;"));
  const link = whatsappLink({ number: "NUR-TEST22", customer_name: "Nour & <Co> #1", customer_phone: "01012345678", total_piasters: 127500, area_name: "Cairo", payment_method: "cod" });
  assert.match(link, /^https:\/\/wa\.me\/201012345678\?text=[^\s<>&#]*$/);
});
