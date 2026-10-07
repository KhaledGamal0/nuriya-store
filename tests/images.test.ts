// Every photo has a blur-up preview (no blank flash while it loads), and every photo the shop
// uses actually exists on disk.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { TONES } from "../lib/blur.ts";
import { staticCatalog } from "../lib/catalog.ts";

test("every photo in public/images has preview colours (run: python3 scripts/make-blur.py)", () => {
  for (const f of readdirSync("public/images").filter((n) => n.endsWith(".jpg"))) {
    const t = TONES[`/images/${f}`];
    assert.ok(t, `missing preview colours for /images/${f}`);
    assert.ok(t.every((c) => /^#[0-9a-f]{6}$/.test(c)), `bad colours for ${f}`);
  }
});

test("every gallery photo exists and has a preview", () => {
  const c = staticCatalog();
  for (const color of c.colorOrder)
    for (const img of c.colors[color].images) {
      assert.ok(existsSync(`public${img.src}`), `missing file public${img.src}`);
      assert.ok(TONES[img.src], `missing preview for ${img.src}`);
      assert.equal(Math.round((img.height / img.width) * 100), 125, `${img.src} should be 4:5`);
    }
});
