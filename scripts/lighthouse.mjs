// Lighthouse on the production build, mobile (simulated 4G, mid-range phone).
// Budget from CLAUDE.md: Performance >= 95, Accessibility/Best practices/SEO >= 95, LCP < 2.0 s, CLS < 0.05.
// Writes ui-report/lighthouse.md and adds failing lines to ui-report/lighthouse-findings.json.
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PAGES = ["/", "/quiet-confidence/cream", "/quiet-confidence/burgundy", "/checkout", "/returns"];
const chrome = chromium.executablePath();
const rows = [];
const findings = [];

for (const path of PAGES) {
  const out = `/tmp/lh-${path.replace(/\W+/g, "_") || "home"}.json`;
  execFileSync(
    "npx",
    ["lighthouse", BASE + path, "--quiet", "--output=json", `--output-path=${out}`, "--form-factor=mobile",
     "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless=new --no-sandbox"],
    { env: { ...process.env, CHROME_PATH: chrome }, stdio: "inherit" },
  );
  const r = JSON.parse(await fs.readFile(out, "utf8"));
  const score = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
  const a = r.audits;
  const row = {
    path,
    perf: score("performance"),
    a11y: score("accessibility"),
    bp: score("best-practices"),
    seo: score("seo"),
    lcp: a["largest-contentful-paint"].numericValue / 1000,
    cls: a["cumulative-layout-shift"].numericValue,
    tbt: a["total-blocking-time"].numericValue,
    jsKb: Math.round(
      (a["network-requests"]?.details?.items ?? []).filter((i) => i.resourceType === "Script").reduce((s, i) => s + (i.transferSize ?? 0), 0) / 1024,
    ),
  };
  rows.push(row);
  const fail = (msg) => findings.push({ vp: "mobile", where: path, kind: "lighthouse", detail: msg });
  if (row.perf < 95) fail(`performance ${row.perf} (budget 95)`);
  for (const k of ["a11y", "bp", "seo"]) if (row[k] < 95) fail(`${k} ${row[k]} (budget 95)`);
  if (row.lcp > 2.0) fail(`LCP ${row.lcp.toFixed(2)}s (budget 2.0s)`);
  if (row.cls > 0.05) fail(`CLS ${row.cls.toFixed(3)} (budget 0.05)`);
  if (row.jsKb > 150) fail(`JavaScript ${row.jsKb} KB transferred`);
  const opportunities = Object.values(a)
    .filter((x) => x.details?.type === "opportunity" && (x.details.overallSavingsMs ?? 0) > 100)
    .map((x) => `${x.title} (~${Math.round(x.details.overallSavingsMs)} ms)`);
  row.tips = opportunities.slice(0, 4).join("; ");
}

let md = "# Lighthouse (mobile, simulated 4G)\n\n| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |\n|---|---|---|---|---|---|---|---|---|\n";
for (const r of rows) md += `| ${r.path} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.lcp.toFixed(2)}s | ${r.cls.toFixed(3)} | ${Math.round(r.tbt)}ms | ${r.jsKb} KB |\n`;
md += "\n" + rows.filter((r) => r.tips).map((r) => `- ${r.path}: ${r.tips}`).join("\n") + "\n";
await fs.writeFile("ui-report/lighthouse.md", md);
await fs.writeFile("ui-report/lighthouse-findings.json", JSON.stringify(findings, null, 2));
const report = await fs.readFile("ui-report/report.md", "utf8").catch(() => "# UI/UX audit\n\n");
const lines = findings.map((f) => `- [mobile] ${f.where}: ${f.detail}`).join("\n");
await fs.writeFile("ui-report/report.md", report + `\n## lighthouse (${findings.length})\n${lines}\n\n` + md);
console.log(md);
