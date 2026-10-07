// Stress and chaos test, run in CI against the production build + a real Postgres (never the live site).
//  1. Page load: thousands of requests, 50 at a time.
//  2. Crowd: 30 real browsers buy the same size at the same moment; only 10 are in stock.
//  3. Chaos: internet drops mid-order, the response is lost after the order was saved, back button,
//     refresh, tampered bag, Arabic numerals and text, a 320 px phone, slow 3G, a bot, a device
//     spamming orders and lookups, and a brute-forced refresh secret.
// Every scenario checks the database afterwards: the books must balance.
import fs from "node:fs/promises";
import { chromium } from "playwright";
import postgres from "postgres";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const db = postgres(process.env.DATABASE_URL, { max: 2, onnotice: () => {} });
const findings = [];
const metrics = [];
const add = (where, detail) => findings.push(`- ${where}: ${detail}`);
const metric = (what, value) => metrics.push(`| ${what} | ${value} |`);
const PHONE_LIKE = "0107%";
const CHECKOUT_LIMIT = 30; // LIMITS.checkoutPerDevice.max in lib/orders.ts
let ipSeq = 1;
let seq = 0;
const nextPhone = () => `0107${String(Date.now() % 1000).padStart(3, "0")}${String(seq++).padStart(4, "0")}`;
const ordersFor = async (phone) => (await db`SELECT number, total_piasters FROM orders WHERE customer_phone = ${phone}`).map((r) => ({ ...r }));

async function scenario(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
  } catch (e) {
    add(name, `failed: ${String(e?.message ?? e).split("\n")[0].slice(0, 180)}`);
  }
  metric(`${name} (time)`, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

// ---------- helpers ----------
const browser = await chromium.launch();
const phoneCtx = (extra = {}) => browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ...extra });

/** Each simulated customer gets their own internet address, like real life (unless a test sets one). */
async function open(extra = {}) {
  const ip = `198.51.${Math.floor(ipSeq / 250)}.${(ipSeq++ % 250) + 1}`;
  const ctx = await phoneCtx({ ...extra, extraHTTPHeaders: { "x-forwarded-for": ip, ...(extra.extraHTTPHeaders ?? {}) } });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  return { ctx, page };
}

async function setBag(page, lines) {
  await page.goto(BASE + "/size-guide", { waitUntil: "domcontentloaded" });
  await page.evaluate((l) => localStorage.setItem("nuriya-bag-v1", JSON.stringify(l)), lines);
}

async function fillCheckout(page, phone, { name = "Stress Buyer", area = "cairo", address = "5 Stress Test St, building 2, floor 1" } = {}) {
  await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Area").selectOption(area);
  await page.getByLabel("Address").fill(address);
}

const placeButton = (page) => page.getByRole("button", { name: /Place order/ });

/** Start waiting for the server's answer (or a failed request) BEFORE tapping, so an old message on
 * screen is never mistaken for the new answer. */
function answer(page, timeout = 60000) {
  const isOrder = (r) => r.method() === "POST" && new URL(r.url()).pathname === "/checkout";
  return Promise.race([
    page.waitForResponse((res) => isOrder(res.request()), { timeout }).catch(() => null),
    page.waitForEvent("requestfailed", { predicate: isOrder, timeout }).catch(() => null),
  ]);
}

/** Tap "Place order" and return the result of THIS tap. */
async function submit(page, timeout) {
  const waiting = answer(page, timeout);
  await placeButton(page).click();
  await waiting;
  return outcome(page, timeout);
}

/** After the answer arrived: the thank-you page, or the message shown on the form. */
async function outcome(page, timeout = 30000) {
  await page.waitForTimeout(300); // let React show the answer
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (page.url().includes("/checkout/done")) return { done: true, number: new URL(page.url()).searchParams.get("o") };
    const err = page.locator(".form-err");
    if (await err.count()) return { done: false, message: (await err.first().innerText()).trim() };
    await page.waitForTimeout(150);
  }
  return { done: false, message: "(no response)" };
}

// ---------- 1. Page load ----------
await scenario("page load", async () => {
  const paths = ["/", "/quiet-confidence/white", "/quiet-confidence/burgundy", "/size-guide", "/returns", "/checkout", "/api/health"];
  const total = 2400;
  const times = [];
  let errors = 0;
  let next = 0;
  const t0 = Date.now();
  await Promise.all(
    Array.from({ length: 50 }, async () => {
      while (next < total) {
        const p = paths[next++ % paths.length];
        const s = Date.now();
        const res = await fetch(BASE + p).catch(() => null);
        if (!res || res.status !== 200) errors++;
        await res?.arrayBuffer().catch(() => {});
        times.push(Date.now() - s);
      }
    }),
  );
  times.sort((a, b) => a - b);
  const q = (x) => times[Math.min(times.length - 1, Math.floor(times.length * x))];
  metric("page load: requests / errors", `${total} / ${errors}`);
  metric("page load: throughput", `${Math.round((total / (Date.now() - t0)) * 1000)} req/s`);
  metric("page load: p50 / p95 / max", `${q(0.5)} / ${q(0.95)} / ${times.at(-1)} ms`);
  if (errors) add("page load", `${errors} of ${total} requests failed`);
  if (q(0.95) > 2000) add("page load", `slow under load: p95 ${q(0.95)} ms`);
});

// ---------- 2. Crowd: 30 buyers, 10 in stock ----------
await scenario("crowd: 30 buyers, 10 pieces", async () => {
  await db`UPDATE variants SET track_inventory = true, stock_on_hand = 10, stock_reserved = 0 WHERE sku = 'NUR-QC-CRM-SM'`;
  try {
    const buyers = await Promise.all(
      Array.from({ length: 30 }, async () => {
        const b = await open();
        b.phone = nextPhone();
        await setBag(b.page, [{ color: "cream", size: "S/M", qty: 1 }]);
        await fillCheckout(b.page, b.phone);
        return b;
      }),
    );
    const t0 = Date.now();
    const answers = buyers.map((b) => answer(b.page));
    await Promise.all(buyers.map((b) => placeButton(b.page).click()));
    await Promise.all(answers);
    const results = await Promise.all(buyers.map((b) => outcome(b.page, 45000)));
    metric("crowd: all 30 answered in", `${((Date.now() - t0) / 1000).toFixed(1)} s`);
    const done = results.filter((r) => r.done).length;
    const soldOut = results.filter((r) => !r.done && /sold out/i.test(r.message)).length;
    const other = results.filter((r) => !r.done && !/sold out/i.test(r.message)).map((r) => r.message);
    metric("crowd: thank-you pages / sold-out messages", `${done} / ${soldOut}`);
    if (done !== 10) add("crowd", `expected exactly 10 orders to succeed, got ${done}`);
    if (other.length) add("crowd", `unexpected messages: ${[...new Set(other)].join(" | ").slice(0, 200)}`);
    const [v] = await db`SELECT stock_reserved FROM variants WHERE sku = 'NUR-QC-CRM-SM'`;
    const [{ n }] = await db`SELECT count(*)::int AS n FROM orders WHERE customer_phone = ANY(${buyers.map((b) => b.phone)})`;
    if (n !== 10 || v.stock_reserved !== 10) add("crowd", `database: ${n} orders saved, ${v.stock_reserved} reserved (expected 10 and 10)`);
    for (const b of buyers) if (b.page.errors.length) add("crowd", `page error: ${b.page.errors[0].slice(0, 120)}`);
    await Promise.all(buyers.map((b) => b.ctx.close()));
  } finally {
    await db`UPDATE variants SET track_inventory = false, stock_on_hand = 0, stock_reserved = 0 WHERE sku = 'NUR-QC-CRM-SM'`;
  }
});

// ---------- 3. Chaos ----------
await scenario("internet drops while ordering", async () => {
  const { ctx, page } = await open();
  const phone = nextPhone();
  await setBag(page, [{ color: "burgundy", size: "L/XL", qty: 1 }]);
  await fillCheckout(page, phone);
  await ctx.setOffline(true);
  const r1 = await submit(page, 15000);
  if (r1.done || !/couldn.t reach the shop/i.test(r1.message)) add("offline", `expected the no-connection message, got: ${r1.message ?? "thank-you page"}`);
  if ((await page.getByLabel("Full name").inputValue()) !== "Stress Buyer") add("offline", "the form was cleared");
  if (await page.getByText("Something went wrong").count()) add("offline", "the error page was shown instead of a calm message");
  await ctx.setOffline(false);
  const r2 = await submit(page);
  if (!r2.done) add("offline", `retry after reconnecting did not complete: ${r2.message}`);
  const saved = await ordersFor(phone);
  if (saved.length !== 1) add("offline", `expected 1 order, database has ${saved.length}`);
  await ctx.close();
});

await scenario("order saved but the answer is lost", async () => {
  const { ctx, page } = await open();
  const phone = nextPhone();
  await setBag(page, [{ color: "cream", size: "L/XL", qty: 2 }]);
  await fillCheckout(page, phone);
  let dropped = false;
  await page.route("**/checkout", async (route) => {
    if (route.request().method() === "POST" && !dropped) {
      dropped = true;
      await route.fetch(); // the server receives and saves the order...
      return route.abort("connectionreset"); // ...but the phone never hears back
    }
    return route.continue();
  });
  const r1 = await submit(page, 20000);
  if (r1.done) add("lost answer", "the lost answer was not simulated");
  const before = await ordersFor(phone);
  const r2 = await submit(page);
  const after = await ordersFor(phone);
  if (before.length !== 1) add("lost answer", `the first try should have saved 1 order, found ${before.length}`);
  if (!r2.done) add("lost answer", `tapping again did not reach the thank-you page: ${r2.message}`);
  if (after.length !== 1) add("lost answer", `tapping again created a duplicate: ${after.length} orders`);
  if (r2.done && after[0] && r2.number !== after[0].number) add("lost answer", `thank-you page shows ${r2.number}, database has ${after[0].number}`);

  // Refresh keeps the confirmation; Back does not re-order.
  await page.reload({ waitUntil: "networkidle" });
  if (!(await page.getByText("Order placed successfully").isVisible())) add("refresh", "thank-you page lost its confirmation after refresh");
  if (!(await page.evaluate(() => document.body.innerText.includes("2,075 EGP")))) add("refresh", "order summary missing after refresh (expected 2,075 EGP)");
  await page.goBack({ waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(800);
  if ((await ordersFor(phone)).length !== 1) add("back button", "going back created another order");
  if (page.errors.length) add("lost answer", `page error: ${page.errors[0].slice(0, 120)}`);
  await ctx.close();
});

await scenario("tampered bag", async () => {
  const { ctx, page } = await open();
  const phone = nextPhone();
  await setBag(page, [
    { color: "cream", size: "S/M", qty: 999, price: 1 },
    { color: "gold", size: "S/M", qty: 1 },
    { color: "cream", size: "XXL", qty: 1 },
    "junk",
    null,
  ]);
  await fillCheckout(page, phone);
  if (page.errors.length) add("tampered bag", `checkout crashed: ${page.errors[0].slice(0, 120)}`);
  const text = await page.evaluate(() => document.body.innerText);
  if (!text.includes("6,075 EGP")) add("tampered bag", "checkout total should be 6,075 EGP (5 pieces max + Cairo delivery)");
  const r = await submit(page);
  const [o] = await ordersFor(phone);
  if (!r.done || !o) add("tampered bag", `order did not go through: ${r.message}`);
  else if (o.total_piasters !== 607500) add("tampered bag", `charged ${o.total_piasters} piasters, expected 607500`);
  await ctx.close();
});

await scenario("Arabic numerals and Arabic text", async () => {
  const { ctx, page } = await open();
  const n = String(seq++).padStart(4, "0");
  const latin = `0107999${n}`;
  const arabic = latin.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
  await setBag(page, [{ color: "cream", size: "S/M", qty: 1 }]);
  await fillCheckout(page, arabic, { name: "نور أحمد", address: "١٢ شارع الحرية، الدور الثالث" });
  if (await page.locator(".f-err").count()) add("arabic", `field error: ${await page.locator(".f-err").first().innerText()}`);
  const r = await submit(page);
  if (!r.done) add("arabic", `order with Arabic numerals was refused: ${r.message}`);
  if ((await ordersFor(latin)).length !== 1) add("arabic", "order not saved under the normal phone number");
  if (r.done && !(await page.getByText("Thank you, نور.").isVisible())) add("arabic", "thank-you page does not greet the Arabic name");
  await ctx.close();
});

await scenario("bot fills the hidden field", async () => {
  const { ctx, page } = await open();
  const phone = nextPhone();
  await setBag(page, [{ color: "cream", size: "S/M", qty: 1 }]);
  await fillCheckout(page, phone);
  await page.evaluate(() => {
    document.querySelector('input[name="hp_note"]').value = "I am a bot";
  });
  const r = await submit(page);
  if (r.done) add("bot", "the bot's order was accepted");
  if ((await ordersFor(phone)).length) add("bot", "the bot's order was saved");
  await ctx.close();
});

await scenario("one device spamming orders", async () => {
  const { ctx, page } = await open({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.9" } });
  const outcomes = [];
  for (let i = 0; i < CHECKOUT_LIMIT + 1; i++) {
    await setBag(page, [{ color: "cream", size: "S/M", qty: 1 }]);
    await fillCheckout(page, nextPhone());
    const r = await submit(page);
    outcomes.push(r.done ? "ok" : /too many attempts/i.test(r.message) ? "limited" : r.message);
  }
  const oks = outcomes.filter((o) => o === "ok").length;
  metric("spam device: results", `${oks} orders, then ${outcomes.at(-1)}`);
  if (oks !== CHECKOUT_LIMIT || outcomes.at(-1) !== "limited") add("spam device", `expected ${CHECKOUT_LIMIT} orders then "too many attempts": ${outcomes.join(", ")}`);
  await ctx.close();
});

await scenario("small 320 px phone", async () => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await setBag(page, [{ color: "burgundy", size: "S/M", qty: 2 }]);
  for (const p of ["/", "/quiet-confidence/white", "/checkout", "/returns", "/size-guide"]) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) add("320 px", `${p} scrolls sideways by ${over} px`);
  }
  await ctx.close();
});

await scenario("slow 3G, full purchase", async () => {
  const { ctx, page } = await open();
  const cdp = await ctx.newCDPSession(page);
  page.setDefaultTimeout(90000);
  page.setDefaultNavigationTimeout(90000);
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 });
  const t0 = Date.now();
  await page.goto(BASE + "/quiet-confidence/white", { waitUntil: "load", timeout: 60000 });
  await page.locator("#size-group").getByRole("button", { name: "L/XL" }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await fillCheckout(page, nextPhone());
  const r = await submit(page, 60000);
  const s = (Date.now() - t0) / 1000;
  metric("slow 3G: product page → thank-you page", `${s.toFixed(1)} s`);
  if (!r.done) add("slow 3G", `purchase did not complete: ${r.message}`);
  await ctx.close();
});

await scenario("refresh secret brute force", async () => {
  let accepted = 0;
  await Promise.all(
    Array.from({ length: 60 }, async (_, i) => {
      const res = await fetch(BASE + "/api/revalidate", { method: "POST", headers: { authorization: `Bearer guess-${i}` } });
      if (res.status !== 401) accepted++;
    }),
  );
  if (accepted) add("brute force", `${accepted} wrong secrets were not refused`);
});

// ---------- books must balance ----------
const [books] = await db`
  SELECT count(*)::int AS orders,
         count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id))::int AS without_items,
         count(*) FILTER (WHERE o.subtotal_piasters <> (SELECT coalesce(sum(line_piasters), 0) FROM order_items i WHERE i.order_id = o.id))::int AS wrong_subtotal,
         count(DISTINCT number)::int AS numbers
  FROM orders o WHERE customer_phone LIKE ${PHONE_LIKE}`;
metric("stress orders saved (all scenarios)", books.orders);
if (books.without_items || books.wrong_subtotal || books.numbers !== books.orders) add("books", `orders without items: ${books.without_items}, wrong subtotal: ${books.wrong_subtotal}, duplicate numbers: ${books.orders - books.numbers}`);

await db`DELETE FROM orders WHERE customer_phone LIKE ${PHONE_LIKE}`;
await db`DELETE FROM customers WHERE phone LIKE ${PHONE_LIKE}`;
await db`DELETE FROM rate_limits`;
await browser.close();
await db.end();

const md = `\n## Stress and chaos (${findings.length} findings)\n${findings.join("\n") || "- All scenarios behaved correctly and the books balance."}\n\n| Measure | Result |\n|---|---|\n${metrics.join("\n")}\n`;
await fs.appendFile("ui-report/report.md", md);
console.log(md);
if (findings.length) process.exitCode = 1;
