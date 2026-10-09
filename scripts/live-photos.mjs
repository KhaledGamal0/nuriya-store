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
    await ctx.route(/facebook\.com\/tr/, (r) => r.abort()); // never send test visits to the real Meta Pixel
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
// Shop events: do what a shopper does on the live site and check each action reaches the stats code.
// The stats script itself is blocked here, so this test never adds fake visits to the real numbers.
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  await ctx.route("**/_vercel/insights/**", (r) => r.abort());
  // Meta Pixel: its script loads for real, but what it would send to Meta is caught here and never sent.
  const meta = [];
  await ctx.route(/facebook\.com\/tr/, (r) => {
    const u = new URL(r.request().url());
    meta.push(u.searchParams.get("ev") + (u.searchParams.get("cd[value]") ? ` ${u.searchParams.get("cd[value]")} ${u.searchParams.get("cd[currency]")}` : ""));
    return r.abort();
  });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("nuriya-sale-seen", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(SITE + "/quiet-confidence/white", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("#size-group").getByRole("button", { name: "S/M" }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.waitForTimeout(1200);
  const onProduct = await page.evaluate(() => (window.vaq || []).map((a) => (a[1] && a[1].name) + " " + JSON.stringify((a[1] && a[1].data) || {})));
  rows.push(`events on product page: ${onProduct.join(" | ") || "none"}`);
  await page.goto(SITE + "/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByLabel("Area").selectOption("alexandria");
  const names = await page.evaluate(() => (window.vaq || []).map((a) => (a[1] && a[1].name) + " " + JSON.stringify((a[1] && a[1].data) || {})));
  rows.push(`events on checkout page: ${names.join(" | ") || "none"}`);
  await page.waitForTimeout(3000);
  const pixelId = await page.evaluate(() => typeof window.fbq === "function" && !!document.querySelector('script[src*="connect.facebook.net"]'));
  rows.push(`Meta Pixel: ${pixelId ? "loaded" : "MISSING"} · events it sent: ${meta.join(" | ") || "none"}`);
  await ctx.close();
}
await browser.close();
console.log(rows.join("\n"));
