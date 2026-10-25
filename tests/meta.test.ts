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

import { parseClientEvent } from "../lib/meta-capi.ts";

test("Browser notes: only our three events, our products and sane numbers are accepted", () => {
  const ok = parseClientEvent({ name: "AddToCart", eventId: "atc-abc123def456", path: "/quiet-confidence/white",
    custom: { content_ids: ["cream", "evil"], value: 900, contents: [{ id: "cream", quantity: 1, item_price: 900 }], content_name: "White · S/M", extra: "x" } });
  assert.ok(ok);
  assert.deepEqual(ok!.custom.content_ids, ["cream"]);
  assert.equal(ok!.custom.value, 900);
  assert.equal((ok!.custom as Record<string, unknown>).extra, undefined);
  assert.equal(parseClientEvent({ name: "Purchase", eventId: "atc-abc123def456", path: "/" }), null); // purchases only from the server's order
  assert.equal(parseClientEvent({ name: "AddToCart", eventId: "<script>", path: "/" }), null);
  assert.equal(parseClientEvent({ name: "AddToCart", eventId: "atc-abc123def456", path: "https://evil.com" }), null);
  assert.equal(parseClientEvent({ name: "AddToCart", eventId: "atc-abc123def456", path: "/", custom: { value: 1e9 } })!.custom.value, undefined);
});

import { metaPlace } from "../lib/meta-capi.ts";

test("Meta place: delivery area becomes state/city in Meta's format", () => {
  assert.deepEqual(metaPlace("Cairo & Giza"), { st: "cairo", ct: "cairo" });
  assert.deepEqual(metaPlace("Alexandria"), { st: "alexandria", ct: "alexandria" });
  assert.deepEqual(metaPlace("Giza countryside"), { st: "giza" });
  assert.deepEqual(metaPlace("Port Said"), { st: "portsaid", ct: "portsaid" });
});

test("Returning buyer id: only a 64-hex hash is passed on, never anything else", async () => {
  const xid = "a".repeat(64);
  const ok = parseClientEvent({ name: "ViewContent", eventId: "vc-abc123def456", path: "/", xid });
  assert.equal(ok?.externalId, xid);
  assert.equal(parseClientEvent({ name: "ViewContent", eventId: "vc-abc123def456", path: "/", xid: "01012345678" })?.externalId, undefined);
  process.env.META_CAPI_TOKEN = "t";
  let body = "";
  const real = globalThis.fetch;
  globalThis.fetch = (async (_u: unknown, init?: RequestInit) => { body = String(init?.body); return new Response("{}"); }) as typeof fetch;
  try {
    const { sendServerPurchase } = await import("../lib/meta-capi.ts");
    await sendServerPurchase({ orderNumber: "NUR-T2", totalPiasters: 97_500, lines: [{ color: "cream", qty: 1, linePiasters: 90_000 }], phone: "01012345678", name: "Sara Ali", area: "Alexandria", ip: null, userAgent: null, url: "https://nuriya.app/checkout" });
  } finally { globalThis.fetch = real; delete process.env.META_CAPI_TOKEN; }
  const u = JSON.parse(body).data[0].user_data;
  assert.match(u.st[0], /^[0-9a-f]{64}$/);
  assert.match(u.external_id[0], /^[0-9a-f]{64}$/);
  assert.ok(!body.toLowerCase().includes("alexandria"), "area is hashed too");
});

test("InitiateCheckout: customer details accepted only on InitiateCheckout, only a valid phone, and sent hashed", async () => {
  const base = { eventId: "ic-abc123def456", path: "/checkout", custom: { value: 1000 } };
  const ic = parseClientEvent({ ...base, name: "InitiateCheckout", user: { phone: "01012345678", name: "Sara Ahmed", area: "Alexandria" } });
  assert.deepEqual(ic?.user, { phone: "01012345678", name: "Sara Ahmed", area: "Alexandria" });
  assert.equal(parseClientEvent({ ...base, name: "AddToCart", eventId: "atc-abc123def456", user: { phone: "01012345678", name: "Sara" } })?.user, undefined, "not on other events");
  assert.equal(parseClientEvent({ ...base, name: "InitiateCheckout", user: { phone: "123", name: "Sara" } })?.user, undefined, "bad phone dropped");
  process.env.META_CAPI_TOKEN = "t";
  let body = "";
  const real = globalThis.fetch;
  globalThis.fetch = (async (_u: unknown, init?: RequestInit) => { body = String(init?.body); return new Response("{}"); }) as typeof fetch;
  try {
    const { sendServerEvents } = await import("../lib/meta-capi.ts");
    await sendServerEvents([{ name: "InitiateCheckout", eventId: ic!.eventId, url: "https://nuriya.app/checkout", custom: ic!.custom, visitor: { ip: null, userAgent: null, ...ic!.user } }]);
  } finally { globalThis.fetch = real; delete process.env.META_CAPI_TOKEN; }
  const e = JSON.parse(body).data[0];
  assert.equal(e.event_id, "ic-abc123def456", "same event id as the browser event");
  for (const k of ["ph", "fn", "ln", "st", "ct", "country", "external_id"]) assert.match(e.user_data[k][0], /^[0-9a-f]{64}$/, k);
  assert.ok(!/1012345678|sara|ahmed|alexandria/i.test(body), "nothing in clear");
});

// Oct 25 2026: anonymous visitor id (nuriya_vid) as external_id on every event; server PageView copy.
test("external_id: visitor id first, then her scrambled phone; PageView server copy has no product data", async () => {
  const { sendServerEvents, purchaseEvent, parseClientEvent } = await import("../lib/meta-capi.ts");
  const { createHash } = await import("node:crypto");
  process.env.META_CAPI_TOKEN = "test-token";
  const vid = "a1".repeat(32);
  let body = "";
  const real = globalThis.fetch;
  globalThis.fetch = (async (_u: unknown, init?: RequestInit) => { body = String(init?.body); return new Response("{}"); }) as typeof fetch;
  try {
    await sendServerEvents([purchaseEvent({ ...order, visitorId: vid })]);
    const p = JSON.parse(body).data[0].user_data;
    assert.deepEqual(p.external_id, [vid, createHash("sha256").update("201012345678").digest("hex")]);
    assert.ok(!body.includes("01012345678") && !body.includes("Sara"), "no phone or name in clear");
    await sendServerEvents([{ name: "PageView", eventId: "pv-abcdef123456", url: "https://nuriya.app/", visitor: { ip: "198.51.100.7", userAgent: "ua", visitorId: vid, fbp: "fb.1.1.1" }, custom: {} }]);
    const pv = JSON.parse(body).data[0];
    assert.equal(pv.event_name, "PageView");
    assert.equal(pv.event_id, "pv-abcdef123456");
    assert.equal(pv.custom_data, undefined);
    assert.deepEqual(pv.user_data.external_id, [vid]);
    assert.equal(pv.user_data.client_ip_address, "198.51.100.7");
    assert.equal(pv.user_data.fbp, "fb.1.1.1");
    await sendServerEvents([{ name: "ViewContent", eventId: "vc-abcdef123456", url: "https://nuriya.app/", visitor: { ip: null, userAgent: null, visitorId: "not-hex" }, custom: {} }]);
    assert.equal(JSON.parse(body).data[0].user_data.external_id, undefined, "a malformed visitor id is dropped");
  } finally {
    globalThis.fetch = real;
  }
  const n = parseClientEvent({ name: "PageView", eventId: "pv-abcdef123456", path: "/", custom: {}, vid });
  assert.equal(n?.name, "PageView");
  assert.equal(n?.visitorId, vid);
  assert.equal(parseClientEvent({ name: "PageView", eventId: "pv-abcdef123456", path: "/", custom: {}, vid: "x" })?.visitorId, undefined);
  assert.equal(parseClientEvent({ name: "Lead", eventId: "ld-abcdef123456", path: "/", custom: {} }), null, "unknown events still refused");
});

test("start-up snippets: visitor id cookie made once (64 hex, 1 year) and passed to the Pixel as external_id", async () => {
  const { fbCookies, fbInit } = await import("../lib/pixel.ts");
  const jar: string[] = [];
  const doc = { get cookie() { return jar.map((c) => c.split(";")[0]).join("; "); }, set cookie(v: string) { const k = v.split("=")[0]; const i = jar.findIndex((c) => c.startsWith(k + "=")); if (i >= 0) jar[i] = v; else jar.push(v); } };
  const calls: unknown[][] = [];
  const win: Record<string, unknown> = {};
  const run = (code: string) => new Function("document", "location", "crypto", "window", "fbq", code)(doc, { search: "" }, globalThis.crypto, win, (...a: unknown[]) => calls.push(a));
  run(fbCookies);
  const first = /nuriya_vid=([0-9a-f]{64})/.exec(doc.cookie)?.[1];
  assert.ok(first, "cookie created");
  assert.match(jar.find((c) => c.startsWith("nuriya_vid="))!, /max-age=31536000; SameSite=Lax; Secure/);
  run(fbCookies);
  assert.equal(/nuriya_vid=([0-9a-f]{64})/.exec(doc.cookie)?.[1], first, "same id on the next visit");
  assert.match(fbInit("123"), /external_id/);
  assert.doesNotMatch(fbInit("123"), /track','PageView/, "first PageView now comes from MetaPixel with an event id");
});
