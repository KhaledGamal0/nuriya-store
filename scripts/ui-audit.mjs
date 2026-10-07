// Automated UI/UX audit. Runs in CI against the production build (next start).
// For every page and key interaction, on a phone and a desktop, it records:
//   screenshots · accessibility violations (axe, WCAG 2.2 AA) · sideways scrolling · tap targets under 44px ·
//   console/page errors · images without alt text · header alignment.
// Output: ui-report/report.md, ui-report/report.json, ui-report/shots/*.png
import { chromium } from "playwright";
import * as axeModule from "@axe-core/playwright";
import fs from "node:fs/promises";

const AxeBuilder = axeModule.AxeBuilder ?? axeModule.default?.default ?? axeModule.default;
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "ui-report";
await fs.mkdir(`${OUT}/shots`, { recursive: true });

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

const PAGES = [
  ["home", "/"],
  ["product-cream", "/quiet-confidence/cream"],
  ["product-burgundy", "/quiet-confidence/burgundy"],
  ["size-guide", "/size-guide"],
  ["returns", "/returns"],
  ["checkout-empty", "/checkout"],
  ["track", "/track"],
  ["order-done", "/checkout/done?o=NUR-ABCDEF&p=cod"],
  ["not-found", "/this-page-does-not-exist"],
];

const findings = [];
const add = (vp, where, kind, detail) => findings.push({ vp, where, kind, detail });

async function checks(page, vp, where) {
  const r = await page.evaluate(() => {
    const out = { overflow: 0, small: [], noAlt: [], header: null };
    out.overflow = document.documentElement.scrollWidth - window.innerWidth;
    const visible = (el) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("dialog:not([open])");
    };
    for (const el of document.querySelectorAll("a, button, input, select, textarea, summary, [role=button]")) {
      if (!visible(el)) continue;
      if (el.closest("[inert], [aria-hidden='true']")) continue; // not reachable by people (e.g. the bot trap)
      if (el.closest("p, li, td") && el.tagName === "A") continue; // inline text links are exempt (WCAG 2.5.8)
      const b = el.getBoundingClientRect();
      if (b.width < 44 - 0.5 || b.height < 44 - 0.5) {
        if (el.type === "hidden" || el.type === "radio") continue;
        out.small.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || el.name || "").trim().slice(0, 30)}" ${Math.round(b.width)}×${Math.round(b.height)}`);
      }
    }
    for (const img of document.querySelectorAll("img")) if (!img.hasAttribute("alt")) out.noAlt.push(img.getAttribute("src")?.slice(0, 60));
    const hdr = document.querySelector(".hdr-in");
    if (hdr) {
      const wrap = hdr.getBoundingClientRect();
      const kids = [...hdr.children].map((k) => {
        const first = [...k.querySelectorAll("a, button")].find((el) => el.getBoundingClientRect().width > 0) ?? k;
        const target = first.tagName === "A" && !first.querySelector("svg") ? first : first.querySelector("svg") ?? first;
        const sides = [...k.querySelectorAll("a, button")].filter((el) => el.getBoundingClientRect().width > 0);
        const last = sides[sides.length - 1] ?? k;
        const lastTarget = last.tagName === "A" && !last.querySelector("svg") ? last : last.querySelector("svg") ?? last;
        const b = { left: target.getBoundingClientRect().left, right: lastTarget.getBoundingClientRect().right, top: target.getBoundingClientRect().top, height: target.getBoundingClientRect().height };
        return { left: Math.round(b.left - wrap.left), right: Math.round(wrap.right - b.right), cy: Math.round(b.top + b.height / 2) };
      });
      const pad = parseFloat(getComputedStyle(hdr).paddingLeft);
      out.header = { pad, kids };
    }
    return out;
  });
  if (r.overflow > 1) add(vp, where, "sideways-scroll", `page is ${r.overflow}px wider than the screen`);
  for (const s of r.small) add(vp, where, "small-tap-target", s);
  for (const s of r.noAlt) add(vp, where, "image-without-alt", s);
  if (r.header && where === "home") {
    const [menu, logo, bag] = r.header.kids;
    if (menu && Math.abs(menu.left - r.header.pad) > 2) add(vp, where, "header-alignment", `menu icon is ${menu.left}px from the edge, gutter is ${r.header.pad}px`);
    if (bag && Math.abs(bag.right - r.header.pad) > 2) add(vp, where, "header-alignment", `bag icon is ${bag.right}px from the edge, gutter is ${r.header.pad}px`);
    if (menu && logo && bag && (Math.abs(menu.cy - logo.cy) > 2 || Math.abs(bag.cy - logo.cy) > 2)) add(vp, where, "header-alignment", "icons and logo are not vertically centered on one line");
    if (logo && Math.abs(logo.left - logo.right) > 2) add(vp, where, "header-alignment", `logo off-center by ${Math.abs(logo.left - logo.right) / 2}px`);
  }
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  for (const v of axe.violations) add(vp, where, `a11y:${v.id}`, `${v.impact} · ${v.help} · ${v.nodes.length}× e.g. ${v.nodes[0]?.target.join(" ")}`);
}

const pending = new Map();
async function step(vp, name, fn) {
  try {
    await fn();
  } catch (e) {
    const open = [...pending.entries()].map(([u, t0]) => `${u.replace(BASE, "")} (${Math.round((Date.now() - t0) / 1000)}s)`).slice(0, 6);
    add(vp, name, "audit-step-failed", `${String(e.message).split("\n")[0].slice(0, 120)} · still loading: ${open.join(", ") || "nothing"}`);
  }
}

async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/shots/${name}.png`, fullPage: true });
}

// Price change in the database -> refresh -> the product page shows the new price; browsing stays fast.
async function refreshCheck(browser) {
  if (!process.env.DATABASE_URL) return;
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  const refresh = (secret) => fetch(BASE + "/api/revalidate", { method: "POST", headers: { authorization: `Bearer ${secret}` } });
  const ctx = await browser.newContext(VIEWPORTS.mobile);
  const page = await ctx.newPage();
  try {
    if ((await refresh("wrong")).status !== 401) add("mobile", "refresh", "security", "refresh endpoint accepted a wrong secret");
    await sql`UPDATE products SET price_piasters = 125000 WHERE slug = 'quiet-confidence'`;
    if ((await refresh(process.env.REVALIDATE_SECRET)).status !== 200) add("mobile", "refresh", "flow", "refresh endpoint rejected the right secret");
    await page.goto(BASE + "/quiet-confidence/cream");
    await page.waitForTimeout(1500);
    await page.goto(BASE + "/quiet-confidence/cream", { waitUntil: "networkidle", timeout: 20000 });
    if (!(await page.getByText("1,250 EGP").first().isVisible())) add("mobile", "refresh", "flow", "new price did not show after refresh");
    for (const path of ["/", "/returns", "/quiet-confidence/burgundy", "/size-guide", "/"]) {
      const t0 = Date.now();
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 20000 }).catch(() => add("mobile", "refresh", "flow", `${path} did not settle after a refresh`));
      if (Date.now() - t0 > 8000) add("mobile", "refresh", "speed", `${path} took ${Date.now() - t0}ms after a refresh`);
    }
  } finally {
    await sql`UPDATE products SET price_piasters = 120000 WHERE slug = 'quiet-confidence'`;
    await refresh(process.env.REVALIDATE_SECRET);
    await sql.end();
    await ctx.close();
  }
}

// Server-level checks: security headers, caching, SEO tags, sitemap, robots, 404 status.
async function techChecks() {
  const f = (where, detail, kind = "tech") => add("server", where, kind, detail);
  const home = await fetch(BASE + "/");
  const h = (n) => home.headers.get(n) ?? "";
  if (!h("strict-transport-security").includes("max-age")) f("/", "missing Strict-Transport-Security header", "security");
  if (h("x-frame-options") !== "DENY") f("/", "missing X-Frame-Options: DENY", "security");
  if (h("x-content-type-options") !== "nosniff") f("/", "missing X-Content-Type-Options: nosniff", "security");
  if (!h("referrer-policy")) f("/", "missing Referrer-Policy", "security");
  if (h("x-powered-by")) f("/", "X-Powered-By header leaks the framework", "security");
  const cc = h("cache-control");
  if (!/s-maxage|max-age=\d{3,}/.test(cc)) f("/", `home page is not cacheable by the CDN (Cache-Control: ${cc || "none"})`, "speed");
  for (const path of ["/", "/quiet-confidence/cream", "/quiet-confidence/burgundy", "/size-guide", "/returns"]) {
    const html = await (await fetch(BASE + path)).text();
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    if (!title || title.length > 70) f(path, `page title missing or too long: "${title}"`, "seo");
    if (!/<meta name="description" content="[^"]{20,}/.test(html)) f(path, "meta description missing or too short", "seo");
    if (!/<meta property="og:image"/.test(html)) f(path, "no share image (og:image)", "seo");
    if (!/<html lang="en"/.test(html)) f(path, "html lang attribute missing", "seo");
    if (path.startsWith("/quiet-confidence/")) {
      const ld = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)?.[1];
      try {
        const data = JSON.parse(ld ?? "");
        if (data["@type"] !== "Product" || data.offers?.priceCurrency !== "EGP" || !(data.offers?.price > 0)) f(path, "product structured data incomplete", "seo");
      } catch {
        f(path, "product structured data missing or invalid", "seo");
      }
    }
  }
  const robots = await (await fetch(BASE + "/robots.txt")).text();
  if (!/Disallow: \/checkout/.test(robots) || !/Sitemap:/.test(robots)) f("/robots.txt", "robots.txt should block /checkout and list the sitemap", "seo");
  const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
  for (const path of ["/quiet-confidence/cream", "/quiet-confidence/burgundy", "/size-guide", "/returns"]) if (!sitemap.includes(path)) f("/sitemap.xml", `sitemap is missing ${path}`, "seo");
  const missing = await fetch(BASE + "/no-such-page");
  if (missing.status !== 404) f("/no-such-page", `unknown page returns ${missing.status}, should be 404`, "seo");
  const checkout = await (await fetch(BASE + "/checkout")).text();
  if (!/noindex/.test(checkout)) f("/checkout", "checkout should not be indexed by search engines", "seo");
}
await techChecks().catch((e) => add("server", "tech", "audit-step-failed", String(e.message).slice(0, 160)));

// Direct database access to prove what the browser flows really saved.
const db = process.env.DATABASE_URL ? (await import("postgres")).default(process.env.DATABASE_URL, { max: 1, onnotice: () => {} }) : null;
const PHONES = { mobile: "010 1234 5678", desktop: "011 1234 5678" };

const browser = await chromium.launch();
for (const [vp, opts] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  let where = "";
  page.on("console", (m) => m.type() === "error" && !(where === "not-found" && m.text().includes("404")) && add(vp, where, "console-error", m.text().slice(0, 160)));
  page.on("pageerror", (e) => add(vp, where, "page-error", e.message.slice(0, 160)));
  page.on("request", (r) => pending.set(r.url(), Date.now()));
  page.on("requestfinished", (r) => pending.delete(r.url()));
  page.on("requestfailed", (r) => pending.delete(r.url()));

  for (const [name, path] of PAGES) {
    where = name;
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await checks(page, vp, name);
    await shot(page, `${vp}-${name}`);
  }

  // Header hides on scroll down and returns on scroll up
  await step(vp, "header-scroll", async () => {
    where = "header-scroll";
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(600);
    if ((await page.locator(".hdr").getAttribute("data-hidden")) !== "true") add(vp, where, "flow", "header did not hide when scrolling down");
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(600);
    if ((await page.locator(".hdr").getAttribute("data-hidden")) !== "false") add(vp, where, "flow", "header did not come back when scrolling up");
  });

  // Opening a page from far down the previous one must land at the very top
  await step(vp, "navigate-to-top", async () => {
    where = "navigate-to-top";
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator("#shop").scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(400);
    await page.locator(".pc").first().click();
    await page.waitForURL(/quiet-confidence/);
    await page.waitForTimeout(700);
    const y = await page.evaluate(() => window.scrollY);
    if (y > 1) add(vp, where, "flow", `product page opened ${Math.round(y)}px down instead of at the top`);
    if ((await page.locator(".hdr").getAttribute("data-hidden")) === "true") add(vp, where, "flow", "header hidden after opening a new page");
    await page.screenshot({ path: `${OUT}/shots/${vp}-navigate-to-top.png` });
  });

  // Interactions
  await step(vp, "menu-open", async () => {
    where = "menu-open";
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    if (vp === "mobile") {
      await page.getByRole("button", { name: "Open menu" }).click();
      await checks(page, vp, where);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/shots/${vp}-menu-open.png` });
      await page.keyboard.press("Escape");
    } else {
      for (const name of ["Cream", "Burgundy", "Size guide", "Instagram"])
        if (!(await page.locator(".hdr").getByRole("link", { name }).isVisible())) add(vp, where, "flow", `header link "${name}" not visible on desktop`);
    }
  });

  await step(vp, "photo-viewer", async () => {
    where = "photo-viewer";
    await page.goto(BASE + "/quiet-confidence/cream", { waitUntil: "networkidle" });
    await page.locator(".gal-i").first().click();
    await page.waitForTimeout(500);
    if (!(await page.locator("dialog.dlg-full[open]").count())) add(vp, where, "flow", "tapping a photo did not open the full-screen viewer");
    await page.getByRole("button", { name: "Next photo" }).click();
    await page.waitForTimeout(700);
    const label = await page.locator("#viewer-title").textContent();
    if (!label?.startsWith("2 /")) add(vp, where, "flow", `next arrow did not move to photo 2 (shows "${label}")`);
    await checks(page, vp, where);
    await page.screenshot({ path: `${OUT}/shots/${vp}-photo-viewer.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    if (await page.locator("dialog[open]").count()) add(vp, where, "flow", "Escape did not close the photo viewer");
  });

  await step(vp, "no-size-preselected", async () => {
    where = "no-size-preselected";
    await page.goto(BASE + "/quiet-confidence/cream", { waitUntil: "networkidle" });
    await page.locator("#size-group").getByRole("button", { name: "L/XL" }).click();
    await page.goto(BASE + "/quiet-confidence/burgundy", { waitUntil: "networkidle" });
    if (await page.locator('#size-group [aria-pressed="true"]').count()) add(vp, where, "flow", "a size was pre-selected when opening a product page");
  });

  await step(vp, "add-without-size", async () => {
    where = "add-without-size";
    await page.goto(BASE + "/quiet-confidence/cream", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Add to bag" }).click();
    if (!(await page.getByText("Choose a size first.").isVisible())) add(vp, where, "flow", "no message when adding without a size");
    await page.screenshot({ path: `${OUT}/shots/${vp}-add-without-size.png` });
  });

  await step(vp, "size-finder", async () => {
    where = "size-finder";
    await page.getByRole("button", { name: "Find my size" }).click();
    await checks(page, vp, where);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/shots/${vp}-size-finder.png` });
    await page.getByRole("button", { name: /^Select / }).click();
  });

  await step(vp, "bag-open", async () => {
    where = "bag-open";
    await page.getByRole("button", { name: "Add to bag" }).click();
    await page.waitForTimeout(1000);
    if (!(await page.locator("dialog[open]").count())) add(vp, where, "flow", "bag did not open after adding");
    await checks(page, vp, where);
    await page.screenshot({ path: `${OUT}/shots/${vp}-bag-open.png` });
  });

  await step(vp, "bag-close", async () => {
    where = "bag-close";
    await page.getByRole("button", { name: "Close bag" }).click();
    await page.waitForTimeout(500);
    if (await page.locator("dialog[open]").count()) add(vp, where, "flow", "bag panel is still open after closing");
  });

  await step(vp, "returns-arabic", async () => {
    where = "returns-arabic";
    await page.goto(BASE + "/returns", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "العربية" }).click();
    if (!(await page.getByText("قبل الاستلام").isVisible())) add(vp, where, "flow", "Arabic policy did not show");
    const dir = await page.locator('[lang="ar"][dir="rtl"]').count();
    if (!dir) add(vp, where, "flow", "Arabic policy is not right-to-left");
    await checks(page, vp, where);
    await shot(page, `${vp}-returns-arabic`);
  });

  await step(vp, "checkout-errors", async () => {
    where = "checkout-errors";
    await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Place order" }).click();
    await page.waitForTimeout(500);
    if (!(await page.getByText("Enter an Egyptian mobile number", { exact: false }).first().isVisible())) add(vp, where, "flow", "no phone error after submitting an empty form");
    const focused = await page.evaluate(() => document.activeElement?.id);
    if (focused !== "phone") add(vp, where, "flow", `focus should move to the first error (phone), it is on "${focused}"`);
    await checks(page, vp, where);
    await shot(page, `${vp}-checkout-errors`);
  });

  await step(vp, "checkout-filled", async () => {
    where = "checkout-filled";
    await page.getByLabel("Mobile number").fill(PHONES[vp]);
    await page.getByLabel("Full name").fill("Nour Ahmed");
    await page.getByLabel("Area").selectOption("alexandria");
    await page.getByLabel("Address").fill("12 El Horreya Rd, building 4, floor 3");
    if (await page.locator(".f-err").count()) add(vp, where, "flow", "errors still showing after every field was fixed");
    if (!(await page.evaluate(() => document.body.innerText.includes("1,290 EGP")))) add(vp, where, "flow", "total did not update to 1,290 EGP for Alexandria");
    await shot(page, `${vp}-checkout-filled`);
    // Double tap: the form is submitted twice in a row. Exactly one order must be saved.
    await page.evaluate(() => {
      const form = document.querySelector(".co form");
      form.requestSubmit();
      form.requestSubmit();
    });
    await page.waitForURL(/\/checkout\/done/, { timeout: 15000 }).catch(() => add(vp, where, "flow", "placing a valid order did not reach the confirmation page"));
    where = "order-placed";
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => document.title.length > 0, null, { timeout: 5000 }).catch(() => {});
    await checks(page, vp, where);
    await shot(page, `${vp}-order-placed`);
  });

  let orderNo = null;
  await step(vp, "order-saved", async () => {
    where = "order-saved";
    orderNo = new URL(page.url()).searchParams.get("o");
    if (!orderNo || !(await page.getByText(`Order ${orderNo}`).isVisible())) add(vp, where, "flow", "confirmation page does not show the order number");
    if (!db) return;
    const phone = PHONES[vp].replace(/\s/g, "");
    const rows = await db`SELECT number, status, total_piasters FROM orders WHERE customer_phone = ${phone}`;
    if (rows.length !== 1) add(vp, where, "order-safety", `expected exactly 1 saved order after a double tap, found ${rows.length}`);
    const o = rows[0];
    if (o && o.number !== orderNo) add(vp, where, "order-safety", `confirmation shows ${orderNo} but the database saved ${o.number}`);
    if (o && o.status !== "CONFIRMATION_NEEDED") add(vp, where, "order-safety", `COD order saved as ${o.status}, expected CONFIRMATION_NEEDED`);
    if (o && o.total_piasters !== 129000) add(vp, where, "order-safety", `saved total ${o.total_piasters} piasters, expected 129000 (1,290 EGP)`);
    const items = o ? await db`SELECT count(*)::int AS n FROM order_items i JOIN orders x ON x.id = i.order_id WHERE x.number = ${o.number}` : [{ n: 0 }];
    if (items[0].n < 1) add(vp, where, "order-safety", "order saved without its items");
  });

  await step(vp, "track-order", async () => {
    where = "track-order";
    if (!orderNo) return;
    await page.getByRole("link", { name: "Track your order" }).first().click();
    await page.waitForURL(/\/track/, { timeout: 10000 });
    await page.waitForTimeout(300);
    if ((await page.getByLabel("Order number").inputValue()) !== orderNo) add(vp, where, "flow", "order number was not filled in from the confirmation page");
    await page.getByLabel("Mobile number").fill("010 0000 0000");
    await page.getByRole("button", { name: "Check status" }).click();
    await page.getByText("We couldn't find an order", { exact: false }).waitFor({ timeout: 10000 }).catch(() => add(vp, where, "security", "wrong phone did not get the not-found message"));
    await page.getByLabel("Mobile number").fill(PHONES[vp]);
    await page.getByRole("button", { name: "Check status" }).click();
    await page.getByText("Received", { exact: false }).first().waitFor({ timeout: 10000 }).catch(() => add(vp, where, "flow", "tracking did not show the order status"));
    if (!(await page.evaluate(() => document.body.innerText.includes("1,290 EGP")))) add(vp, where, "flow", "tracking does not show the order total");
    await checks(page, vp, where);
    await shot(page, `${vp}-track-order`);
  });

  await ctx.close();
}
await refreshCheck(browser).catch((e) => add("mobile", "refresh", "audit-step-failed", String(e.message).slice(0, 160)));
await browser.close();
await db?.end();

const byKind = {};
for (const f of findings) (byKind[f.kind] ??= []).push(f);
let md = `# UI/UX audit\n\n${new Date().toISOString()} · ${findings.length} findings\n\n`;
for (const [kind, list] of Object.entries(byKind)) {
  md += `## ${kind} (${list.length})\n`;
  for (const f of list) md += `- [${f.vp}] ${f.where}: ${f.detail}\n`;
  md += "\n";
}
await fs.writeFile(`${OUT}/report.md`, md);
await fs.writeFile(`${OUT}/report.json`, JSON.stringify(findings, null, 2));
console.log(md);
