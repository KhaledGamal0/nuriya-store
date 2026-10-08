// Measures the LIVE shop like a first-time iPhone visitor (empty cache, 4G speed):
// how long until every photo on the product pages and the home page has actually appeared,
// and where each photo file came from (Vercel edge cache HIT/MISS). Prints a table.
import { chromium, devices } from "playwright";

const SITE = process.env.SITE ?? "https://nuriya.app";
const browser = await chromium.launch();
const rows = [];
for (const path of ["/quiet-confidence/burgundy", "/quiet-confidence/white", "/"]) {
  for (const net of ["5g", "4g"]) {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    const fast = net === "5g";
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: fast ? 30 : 150,
      downloadThroughput: ((fast ? 40 : 9) * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8,
    });
    const files = new Map();
    page.on("response", async (r) => {
      const u = new URL(r.url());
      if (/\.(webp|jpg)$|_next\/image|_vercel\/insights/.test(u.pathname)) files.set(u.pathname + u.search, { status: r.status(), cache: r.headers()["x-vercel-cache"] ?? "-", t: Date.now() });
    });
    const t0 = Date.now();
    await page.goto(SITE + path, { waitUntil: "domcontentloaded" });
    const html = Date.now() - t0;
    // Time until every photo in the first screen + gallery has decoded.
    await page.waitForFunction(() => [...document.querySelectorAll(".gal img, .hero img, main img")].slice(0, 8).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000, polling: 50 }).catch(() => {});
    const all = Date.now() - t0;
    const first = await page.evaluate(() => {
      const e = performance.getEntriesByType("largest-contentful-paint");
      return Math.round(e.at(-1)?.startTime ?? -1);
    }).catch(() => -1);
    await page.waitForTimeout(3000); // the visitor-stats script loads last, after everything else
    const va = await page.evaluate(() => ({ script: !!document.querySelector('script[src*="_vercel/insights"]'), queued: typeof window.va }));
    rows.push(`${path} [${net}] visitor stats: script ${va.script ? "on page" : "MISSING"}, va=${va.queued}`);
    const stats = [...files.entries()].map(([u, f]) => `${u.split("/").pop()} ${f.status} ${f.cache} +${f.t - t0}ms`);
    rows.push(`${path} [${net}] html ${html}ms · LCP ${first}ms · all photos shown ${all}ms\n    ${stats.join("\n    ")}`);
    await ctx.close();
  }
}
await browser.close();
console.log(rows.join("\n"));
