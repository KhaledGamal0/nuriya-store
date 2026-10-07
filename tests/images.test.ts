// Every photo has a blur-up preview (no blank flash while it loads), and every photo the shop
// uses actually exists on disk.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { PREVIEWS } from "../lib/blur.ts";
import imageLoader from "../lib/image-loader.ts";

const WIDTHS = [96, 192, 480, 828, 1200, 1600];
import { staticCatalog } from "../lib/catalog.ts";

test("every photo in public/images has a preview and every prepared size (run: python3 scripts/make-images.py)", () => {
  for (const f of readdirSync("public/images").filter((n) => n.endsWith(".jpg"))) {
    const src = `/images/${f}`;
    assert.ok(PREVIEWS[src]?.startsWith("data:image/webp;base64,"), `missing preview for ${src}`);
    for (const w of WIDTHS) assert.ok(existsSync(`public${imageLoader({ src, width: w })}`), `missing prepared ${imageLoader({ src, width: w })}`);
  }
});

test("every gallery photo exists and has a preview", () => {
  const c = staticCatalog();
  for (const color of c.colorOrder)
    for (const img of c.colors[color].images) {
      assert.ok(existsSync(`public${img.src}`), `missing file public${img.src}`);
      assert.ok(PREVIEWS[img.src], `missing preview for ${img.src}`);
      assert.equal(Math.round((img.height / img.width) * 100), 125, `${img.src} should be 4:5`);
    }
});

test("the widths the site asks for are exactly the widths prepared", async () => {
  const { readFileSync } = await import("node:fs");
  const cfg = readFileSync("next.config.ts", "utf8");
  const nums = (key: string) => (cfg.match(new RegExp(`${key}: \\[([^\\]]*)\\]`))?.[1] ?? "").split(",").map((n) => Number(n.trim())).filter(Boolean);
  assert.deepEqual([...nums("imageSizes"), ...nums("deviceSizes")].sort((a, b) => a - b), WIDTHS);
});
