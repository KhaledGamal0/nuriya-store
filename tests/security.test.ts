import { test } from "node:test";
import assert from "node:assert/strict";
import { allowIp } from "../lib/ip-limit.ts";

test("security headers: CSP, HSTS, no framing, no sniffing are set on every page", async () => {
  const { default: config } = await import("../next.config.ts");
  const rules = await config.headers!();
  const all = rules.find((r) => r.source === "/:path*")!.headers;
  const get = (k: string) => all.find((h) => h.key === k)?.value ?? "";
  const csp = get("Content-Security-Policy");
  for (const part of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "https://connect.facebook.net"]) assert.ok(csp.includes(part), part);
  assert.ok(!csp.includes("'unsafe-eval'"), "no eval");
  assert.match(get("Strict-Transport-Security"), /max-age=\d{8}/);
  assert.equal(get("X-Frame-Options"), "DENY");
  assert.equal(get("X-Content-Type-Options"), "nosniff");
});

test("per-device limit: allows normal use, stops floods", () => {
  const key = `t:${Math.random()}`;
  for (let i = 0; i < 5; i++) assert.ok(allowIp(key, 5, 60_000));
  assert.equal(allowIp(key, 5, 60_000), false);
  assert.ok(allowIp(`${key}:other`, 5, 60_000), "other devices unaffected");
});
