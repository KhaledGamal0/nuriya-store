// "Database down" drill. The site is started with a DATABASE_URL that points at a closed port.
// Expected: every shop page still opens (they are pre-built), /api/health reports the problem
// without leaking anything, and checkout refuses calmly instead of crashing or using stale prices.
import fs from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const findings = [];
const add = (where, detail) => findings.push(`- ${where}: ${detail}`);

for (const path of ["/", "/quiet-confidence/cream", "/quiet-confidence/burgundy", "/checkout", "/returns", "/size-guide", "/track"]) {
  const res = await fetch(BASE + path).catch(() => null);
  if (!res || res.status !== 200) add(path, `returned ${res?.status ?? "no response"} while the database was down`);
}

const health = await fetch(BASE + "/api/health").catch(() => null);
const body = health ? await health.text() : "";
if (health?.status !== 503 || !body.includes('"database":"error"')) add("/api/health", `expected 503 database:error, got ${health?.status} ${body.slice(0, 80)}`);
if (/postgres|localhost|5999|password/i.test(body)) add("/api/health", "response leaks connection details");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(BASE + "/quiet-confidence/cream", { waitUntil: "networkidle" });
  await page.locator("#size-group").getByRole("button", { name: "L/XL" }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
  await page.getByLabel("Mobile number").fill("010 1234 5678");
  await page.getByLabel("Full name").fill("Nour Ahmed");
  await page.getByLabel("Area").selectOption("alexandria");
  await page.getByLabel("Address").fill("12 El Horreya Rd, building 4, floor 3");
  await page.getByRole("button", { name: /Place order/ }).click();
  const msg = page.getByText("We couldn't place your order just now", { exact: false });
  await msg.first().waitFor({ timeout: 25000 }).catch(() => add("checkout", "no friendly message when the database is down"));
  if (/\/checkout\/done/.test(page.url())) add("checkout", "an order was confirmed while the database was down");
  if ((await page.getByLabel("Full name").inputValue()) !== "Nour Ahmed") add("checkout", "the form was cleared after the failed order");
  await page.screenshot({ path: "ui-report/shots/outage-checkout.png", fullPage: true }).catch(() => {});
} catch (e) {
  add("checkout", `drill failed: ${String(e.message).slice(0, 160)}`);
}
if (errors.length) add("browser", `page errors: ${errors.join(" | ").slice(0, 200)}`);
await browser.close();

const md = `\n## Database-down drill (${findings.length} findings)\n${findings.join("\n") || "- Shop pages stayed up, health reported the outage, checkout refused safely."}\n`;
await fs.appendFile("ui-report/report.md", md);
console.log(md);
if (findings.length) process.exitCode = 1;
