// Every photo has a blur-up preview (no blank flash while it loads), and every photo the shop
// uses actually exists on disk.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { BLUR } from "../lib/blur.ts";
import { staticCatalog } from "../lib/catalog.ts";

test("every photo in public/images has a blur preview (run: python3 scripts/make-blur.py)", () => {
  for (const f of readdirSync("public/images").filter((n) => n.endsWith(".jpg"))) {
    const data = BLUR[`/images/${f}`];
    assert.ok(data, `missing blur preview for /images/${f}`);
    assert.ok(data.length < 400, `preview for ${f} is too big (${data.length} chars)`);
  }
});

test("every gallery photo exists and has a preview", () => {
  const c = staticCatalog();
  for (const color of c.colorOrder)
    for (const img of c.colors[color].images) {
      assert.ok(existsSync(`public${img.src}`), `missing file public${img.src}`);
      assert.ok(BLUR[img.src], `missing preview for ${img.src}`);
      assert.equal(Math.round((img.height / img.width) * 100), 125, `${img.src} should be 4:5`);
    }
});
