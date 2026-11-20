// Khaled, Nov 20 2026: customers never see WhatsApp on the live site until a business WhatsApp is set up.
// The shop's order e-mails and reports keep the WhatsApp link (lib/notify.ts, scripts/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx|ts|css)$/.test(f) ? [p] : [];
  });
}

test("no customer-facing page or component mentions WhatsApp", () => {
  for (const f of [...files("app"), ...files("components")]) {
    if (f.startsWith(join("app", "api"))) continue; // server routes, not shown to customers
    assert.ok(!/whatsapp/i.test(readFileSync(f, "utf8")), `${f} mentions WhatsApp`);
  }
});

test("no customer screen promises a confirmation call or message (Khaled, Nov 20 2026)", () => {
  for (const f of [...files("app"), ...files("components")]) {
    if (f.startsWith(join("app", "api"))) continue;
    const s = readFileSync(f, "utf8").replace(/&apos;/g, "'");
    assert.ok(!/we'll (confirm|contact you to)|we confirm (every|your) order/i.test(s), `${f} promises to confirm the order`);
  }
});

test("order status shown to customers does not mention WhatsApp", async () => {
  const { STATUS_TEXT } = await import("../lib/orders.ts");
  for (const [k, v] of Object.entries(STATUS_TEXT)) assert.ok(!/whatsapp|contact you|confirm with you/i.test(v), `${k}: ${v}`);
});
