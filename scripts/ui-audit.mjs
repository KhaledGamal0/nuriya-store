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
        const svg = k.querySelector("svg") ?? k;
        const b = svg.getBoundingClientRect();
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

async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/shots/${name}.png`, fullPage: true });
}

const browser = await chromium.launch();
for (const [vp, opts] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  let where = "";
  page.on("console", (m) => m.type() === "error" && add(vp, where, "console-error", m.text().slice(0, 160)));
  page.on("pageerror", (e) => add(vp, where, "page-error", e.message.slice(0, 160)));

  for (const [name, path] of PAGES) {
    where = name;
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await checks(page, vp, name);
    await shot(page, `${vp}-${name}`);
  }

  // Interactions
  where = "menu-open";
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await checks(page, vp, where);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/shots/${vp}-menu-open.png` });
  await page.keyboard.press("Escape");

  where = "add-without-size";
  await page.goto(BASE + "/quiet-confidence/cream", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add to bag" }).click();
  if (!(await page.getByText("Choose a size first.").isVisible())) add(vp, where, "flow", "no message when adding without a size");
  await page.screenshot({ path: `${OUT}/shots/${vp}-add-without-size.png` });

  where = "size-finder";
  await page.getByRole("button", { name: "Find my size" }).click();
  await checks(page, vp, where);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/shots/${vp}-size-finder.png` });
  await page.getByRole("button", { name: /^Select / }).click();

  where = "bag-open";
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.waitForTimeout(400);
  await checks(page, vp, where);
  await page.screenshot({ path: `${OUT}/shots/${vp}-bag-open.png` });

  where = "checkout-errors";
  await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Place order" }).click();
  await page.waitForTimeout(800);
  if (!(await page.getByText("Enter an Egyptian mobile number", { exact: false }).isVisible())) add(vp, where, "flow", "no phone error after submitting an empty form");
  await checks(page, vp, where);
  await shot(page, `${vp}-checkout-errors`);

  where = "checkout-filled";
  await page.getByLabel("Mobile number").fill("010 1234 5678");
  await page.getByLabel("Full name").fill("Nour Ahmed");
  await page.getByLabel("Area").selectOption("alexandria");
  await page.getByLabel("Address").fill("12 El Horreya Rd, building 4, floor 3");
  if (!(await page.getByText("1,290 EGP").isVisible())) add(vp, where, "flow", "total did not update to 1,290 EGP for Alexandria");
  await shot(page, `${vp}-checkout-filled`);
  await page.getByRole("button", { name: "Place order" }).click();
  await page.waitForURL(/\/checkout\/done/, { timeout: 10000 }).catch(() => add(vp, where, "flow", "placing a valid order did not reach the confirmation page"));
  where = "order-placed";
  await shot(page, `${vp}-order-placed`);

  await ctx.close();
}
await browser.close();

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
