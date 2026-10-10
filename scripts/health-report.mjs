import { sendReport } from "./report-mail.mjs";
// Health report for Khaled: checks every service the shop depends on and warns BEFORE a limit is reached.
//   - every day: e-mails only if something needs attention (early warning)
//   - every Sunday (or WEEKLY=1): always e-mails the full weekly status
// Reads neon-usage.json and db.json written by earlier workflow steps. Never prints secrets or customer data.
import { readFileSync, writeFileSync } from "node:fs";
import tls from "node:tls";

const SITE = process.env.SITE || "https://nuriya.app";
const HOST = new URL(SITE).hostname;
const REPO = process.env.GITHUB_REPOSITORY;
const WEEKLY = process.env.WEEKLY === "1";
const NEON_PLAN = (process.env.NEON_PLAN || "free").toLowerCase();
const LIMITS = { neonComputeHours: 100, neonStorageGB: 1, resendMonth: 3000, resendDay: 100 }; // Neon Free + Resend Free
const DAY = 86_400_000;

const rows = []; // [section, label, value, level]  level: ok | warn | bad
const add = (section, label, value, level = "ok") => rows.push({ section, label, value, level });
const readJson = (f) => {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return null;
  }
};
const pct = (a, b) => Math.round((a / b) * 100);
const days = (ms) => Math.floor(ms / DAY);

async function gh(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers: { authorization: `Bearer ${process.env.GH_TOKEN}`, accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`GitHub ${path.split("?")[0]} → ${r.status}`);
  return r.json();
}

// ---------- Website ----------
async function website() {
  const times = [];
  let down = 0;
  for (let i = 0; i < 3; i++) {
    const t = Date.now();
    const r = await fetch(SITE + "/", { redirect: "manual" }).catch(() => null);
    if (!r || r.status !== 200) down++;
    else times.push(Date.now() - t);
  }
  add("Website", "Shop opens", down ? `failed ${down} of 3 tries` : `yes, ${Math.min(...times)} ms`, down ? "bad" : "ok");
  const h = await fetch(SITE + "/api/health").then((r) => r.json()).catch(() => null);
  add("Website", "Database answers the site", h?.ok && h?.database === "connected" ? "yes" : `no (${h?.database ?? "no answer"})`, h?.ok ? "ok" : "bad");

  const cert = await new Promise((res) => {
    const s = tls.connect(443, HOST, { servername: HOST }, () => {
      const c = s.getPeerCertificate();
      s.end();
      res(c?.valid_to ? new Date(c.valid_to) : null);
    });
    s.on("error", () => res(null));
    s.setTimeout(10000, () => (s.destroy(), res(null)));
  });
  if (cert) {
    const left = days(cert - Date.now());
    add("Website", "Security certificate (https)", `${left} days left (Vercel renews it by itself)`, left < 14 ? "warn" : "ok");
  } else add("Website", "Security certificate (https)", "could not check", "warn");
}

// ---------- Vercel ----------
async function vercelChecks() {
  const TOKEN = process.env.VERCEL_TOKEN?.trim();
  if (!TOKEN) return add("Vercel", "Access", "VERCEL_TOKEN secret missing: cannot check", "warn");
  let team = "";
  const v = async (path) => {
    const sep = path.includes("?") ? "&" : "?";
    const r = await fetch(`https://api.vercel.com${path}${team ? `${sep}teamId=${team}` : ""}`, { headers: { authorization: `Bearer ${TOKEN}` } });
    if (r.status === 401 || r.status === 403) throw Object.assign(new Error("refused"), { status: r.status });
    if (!r.ok) throw Object.assign(new Error(`${r.status}`), { status: r.status });
    return r.json();
  };
  let project;
  try {
    project = await v("/v9/projects/nuriya-store");
  } catch {
    try {
      const { teams = [] } = await v("/v2/teams");
      for (const t of teams) {
        team = t.id;
        project = await v("/v9/projects/nuriya-store").catch(() => null);
        if (project) break;
      }
    } catch {}
  }
  if (!project) return add("Vercel", "Access", "Vercel refused the token or the project was not found. Create a new token: Vercel → Account settings → Tokens, then update the VERCEL_TOKEN secret.", "warn");

  const { deployments = [] } = await v(`/v6/deployments?projectId=${project.id}&target=production&limit=1`).catch(() => ({}));
  const d = deployments[0];
  const state = d?.state ?? d?.readyState;
  add("Vercel", "Live version", state === "READY" ? `working, published ${days(Date.now() - d.created)} days ago` : `state: ${state ?? "unknown"}`, state === "READY" ? "ok" : "bad");

  const dom = await v(`/v5/domains/${HOST}`).catch(() => null);
  const exp = dom?.domain?.expiresAt;
  if (exp) {
    const left = days(exp - Date.now());
    const renew = dom.domain.renew !== false;
    add("Vercel", `Domain ${HOST}`, `${left} days left · auto-renew ${renew ? "ON" : "OFF"}`, left < 30 || (!renew && left < 60) ? "warn" : "ok");
  } else add("Vercel", `Domain ${HOST}`, "expiry not available from Vercel (check Vercel → Domains)", "ok");
  add("Vercel", "Pro plan payment", "Keep the card on Vercel valid (Vercel → Settings → Billing)", "ok");
}

// ---------- Neon ----------
function neonChecks() {
  const u = readJson("neon-usage.json");
  if (!u) return add("Database (Neon)", "Usage", "could not read usage from Neon (NEON_API_KEY)", "warn");
  const free = NEON_PLAN === "free";
  if (u.computeHours != null) {
    const p = pct(u.computeHours, LIMITS.neonComputeHours);
    add("Database (Neon)", "Running time this month", free ? `${u.computeHours.toFixed(1)} of ${LIMITS.neonComputeHours} free hours (${p}%)` : `${u.computeHours.toFixed(1)} hours`, free && p >= 70 ? (p >= 90 ? "bad" : "warn") : "ok");
  } else add("Database (Neon)", "Running time this month", "not reported by Neon", "ok");
  if (u.storageBytes != null) {
    const gb = u.storageBytes / 1024 ** 3;
    const p = pct(gb, LIMITS.neonStorageGB);
    add("Database (Neon)", "Stored data", free ? `${(gb * 1024).toFixed(1)} MB of ${LIMITS.neonStorageGB * 1024} MB free (${p}%)` : `${(gb * 1024).toFixed(1)} MB`, free && p >= 70 ? (p >= 90 ? "bad" : "warn") : "ok");
  }
  add("Database (Neon)", "Plan", free ? "Free (upgrade to Launch once real orders come in: 7-day undo window, no running-time limit)" : NEON_PLAN, "ok");
}

// ---------- Orders, stock, e-mail ----------
function shopChecks() {
  const db = readJson("db.json");
  if (!db) return add("Shop", "Orders", "could not read the database", "bad");
  add("Shop", "Orders in the last 7 days", String(db.week), "ok");
  add("Shop", "Orders waiting for confirmation", `${db.waiting} (call or WhatsApp each customer)`, "ok");
  add("Shop", "Orders whose e-mail did not go out", String(db.unmailed), db.unmailed > 0 ? "bad" : "ok");
  for (const s of db.stock ?? []) add("Shop", `Stock ${s.color} ${s.size}`, s.tracked ? `${s.available} left` : "not tracked", s.tracked && s.available <= 3 ? "warn" : "ok");
  const m = pct(db.mailsMonth, LIMITS.resendMonth);
  add("E-mail (Resend)", "Order e-mails this month", `${db.mailsMonth} of ${LIMITS.resendMonth} free (${m}%)`, m >= 80 ? "warn" : "ok");
  add("E-mail (Resend)", "Order e-mails today", `${db.mailsToday} of ${LIMITS.resendDay} free per day`, db.mailsToday >= 80 ? "warn" : "ok");
}

// ---------- GitHub (code, backups, automatic checks) ----------
async function githubChecks() {
  const [last] = await gh("/commits?sha=main&per_page=1");
  const idle = days(Date.now() - new Date(last.commit.committer.date));
  add("GitHub", "Days since the last code change", `${idle} (automatic jobs pause at 60)`, idle >= 45 ? "warn" : "ok");

  const bk = await gh("/actions/workflows/db-backup.yml/runs?status=success&per_page=1");
  const b = bk.workflow_runs?.[0];
  const age = b ? Math.round((Date.now() - new Date(b.updated_at)) / 3_600_000) : null;
  add("GitHub", "Last database backup", age == null ? "none found" : `${age} hours ago (kept 30 days)`, age == null || age > 36 ? "bad" : "ok");

  const since = new Date(Date.now() - 7 * DAY).toISOString().slice(0, 10);
  const all = (await gh(`/actions/workflows/uptime.yml/runs?created=%3E%3D${since}&per_page=1`)).total_count ?? 0;
  const upFail = (await gh(`/actions/workflows/uptime.yml/runs?created=%3E%3D${since}&status=failure&per_page=1`)).total_count ?? 0;
  add("GitHub", "Uptime checks (7 days, every 15 min)", all ? `${all - upFail} of ${all} passed` : "none ran", all === 0 ? "bad" : upFail > 2 ? "warn" : "ok");

  // The report's own "Early warning" issue is not counted, or it could never close.
  const issues = (await gh("/issues?labels=alert&state=open&per_page=20")).filter((i) => i.title !== "Early warning");
  add("GitHub", "Open alerts", issues.length ? issues.map((i) => i.title).join(", ") : "none", issues.length ? "warn" : "ok");
}

for (const [name, fn] of [["website", website], ["vercel", vercelChecks], ["neon", neonChecks], ["shop", shopChecks], ["github", githubChecks]]) {
  try {
    await fn();
  } catch (e) {
    add("Report", `Check "${name}"`, `could not run: ${String(e.message).slice(0, 100)}`, "warn");
  }
}

// ---------- Output ----------
const problems = rows.filter((r) => r.level !== "ok");
const bad = rows.some((r) => r.level === "bad");
const date = new Date().toLocaleDateString("en-GB", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });
const subject = WEEKLY
  ? `Nuriya weekly health · ${date} · ${problems.length ? `${problems.length} to check` : "all good"}`
  : `Nuriya early warning · ${problems.map((p) => p.label).slice(0, 2).join(", ")}`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const dot = { ok: "#2E7D4F", warn: "#B7791F", bad: "#B3261E" };
const word = { ok: "OK", warn: "Check soon", bad: "Act now" };
let html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3C0E18">
<h2 style="font-weight:normal;margin:0 0 4px">${esc(WEEKLY ? "Weekly health report" : "Early warning")}</h2>
<p style="margin:0 0 16px;color:#683A46">${esc(date)} · ${problems.length ? `${problems.length} item(s) need attention` : "Everything is healthy. Nothing to do."}</p>`;
const list = WEEKLY ? rows : problems;
let section = "";
html += `<table style="width:100%;border-collapse:collapse;font-size:14px">`;
for (const r of list) {
  if (r.section !== section) {
    section = r.section;
    html += `<tr><td colspan="3" style="padding:16px 0 6px;font-weight:bold;border-bottom:1px solid #E7C7D1">${esc(section)}</td></tr>`;
  }
  html += `<tr><td style="padding:6px 0;border-bottom:1px solid #F3F0E8">${esc(r.label)}</td><td style="padding:6px 8px;border-bottom:1px solid #F3F0E8">${esc(r.value)}</td><td style="padding:6px 0;border-bottom:1px solid #F3F0E8;color:${dot[r.level]};white-space:nowrap;font-weight:bold">${word[r.level]}</td></tr>`;
}
html += `</table><p style="font-size:12px;color:#683A46;margin-top:20px">Sent by the Health report job on GitHub (daily early warnings, full report every Sunday). Site: ${esc(SITE)}</p></div>`;

const text = list.map((r) => `${word[r.level].padEnd(10)} ${r.section} · ${r.label}: ${r.value}`).join("\n");
console.log(subject + "\n\n" + text);
writeFileSync("report.txt", subject + "\n\n" + rows.map((r) => `${word[r.level].padEnd(10)} ${r.section} · ${r.label}: ${r.value}`).join("\n") + "\n");
writeFileSync("report-summary.txt", problems.map((p) => `- ${p.section} · ${p.label}: ${p.value}`).join("\n"));

const send = WEEKLY || problems.length > 0;
if (send) {
  if (!(await sendReport({ kind: "health", subject, html, text }))) process.exitCode = 1;
}
if (process.env.GITHUB_ENV) writeFileSync(process.env.GITHUB_ENV, `PROBLEMS=${problems.length}\nBAD=${bad ? 1 : 0}\n`, { flag: "a" });
