import { test } from "node:test";
import assert from "node:assert/strict";
import { metaName, metaPhone, sendServerPurchase } from "../lib/meta-capi.ts";

const order = {
  orderNumber: "NUR-TEST01",
  totalPiasters: 97_500,
  lines: [{ color: "cream", qty: 1, linePiasters: 90_000 }],
  phone: "01012345678",
  name: "Sara Ahmed Ali",
  ip: "198.51.100.7",
  userAgent: "test",
  url: "https://nuriya.app/checkout",
};

test("Meta phone: Egyptian mobile gets country code 20, anything else is dropped", () => {
  assert.equal(metaPhone("01012345678"), "201012345678");
  assert.equal(metaPhone("010 1234 5678"), "201012345678");
  assert.equal(metaPhone("12345"), null);
});

test("Meta name: first and last word, lowercase", () => {
  assert.deepEqual(metaName("Sara Ahmed Ali"), { fn: "sara", ln: "ali" });
  assert.deepEqual(metaName("Sara"), { fn: "sara", ln: undefined });
});

test("Conversions API: nothing is sent without META_CAPI_TOKEN", async () => {
  delete process.env.META_CAPI_TOKEN;
  let called = false;
  const real = globalThis.fetch;
  globalThis.fetch = (async () => { called = true; return new Response("{}"); }) as typeof fetch;
  try { await sendServerPurchase(order); } finally { globalThis.fetch = real; }
  assert.equal(called, false);
});

test("Conversions API: Purchase uses the order number as event_id and never sends phone or name in clear", async () => {
  process.env.META_CAPI_TOKEN = "test-token";
  let body = "";
  const real = globalThis.fetch;
  globalThis.fetch = (async (_u: unknown, init?: RequestInit) => { body = String(init?.body); return new Response("{}"); }) as typeof fetch;
  try { await sendServerPurchase(order); } finally { globalThis.fetch = real; delete process.env.META_CAPI_TOKEN; }
  const e = JSON.parse(body).data[0];
  assert.equal(e.event_name, "Purchase");
  assert.equal(e.event_id, "NUR-TEST01");
  assert.equal(e.custom_data.value, 975);
  assert.equal(e.custom_data.currency, "EGP");
  assert.match(e.user_data.ph[0], /^[0-9a-f]{64}$/);
  assert.ok(!body.includes("1012345678") && !body.toLowerCase().includes("sara"));
});
