// Sales reports for Khaled, from the orders database (Cairo time). No customer names or phones.
//   daily   (every morning): yesterday, compared with the day before, + orders still to confirm + stock
//   weekly  (Sunday morning): the last 7 days vs the 7 before, best sellers, areas, day by day
//   monthly (the 1st):        last month vs the month before
// Reads sales.json (written by the workflow's SQL step, scripts/sales.sql). E-mails ORDER_ALERT_EMAIL.
import { readFileSync, writeFileSync } from "node:fs";
import { sendReport } from "./report-mail.mjs";

const d = JSON.parse(readFileSync("sales.json", "utf8"));
const mode = d.mode === "weekly" || d.mode === "monthly" ? d.mode : "daily";
const C = d.cur, P = d.prev;

const egp = (p) => `${Math.round(p / 100).toLocaleString("en-US")} EGP`;
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const LOW = 3;

const NAMES = {
  daily: { title: "Daily sales", period: "yesterday", prev: "the day before", when: d.from },
  weekly: { title: "Weekly sales", period: "the last 7 days", prev: "the 7 days before", when: `${d.from} – ${d.to}` },
  monthly: { title: "Monthly sales", period: d.month, prev: "the month before", when: d.month },
};
const N = NAMES[mode];

// "+2 vs the day before", "−15%", "same as" — plain words, no maths for the reader.
function change(now, before, money = false) {
  if (now === before) return "same as before";
  if (before === 0) return `new (0 ${N.prev.replace("the ", "")})`;
  const pct = Math.round(((now - before) / before) * 100);
  const diff = money ? egp(Math.abs(now - before)) : Math.abs(now - before);
  return `${now > before ? "▲" : "▼"} ${diff} (${pct > 0 ? "+" : ""}${pct}%)`;
}

const low = d.stock.filter((s) => s.tracked && s.available <= LOW);
const best = d.byItem[0];
const subject =
  `Nuriya ${mode} · ${N.when} · ${plural(C.orders, "order")} · ${egp(C.total)}` +
  (d.waiting.count ? ` · ${d.waiting.count} to confirm` : "") +
  (low.length ? ` · low stock` : "");

// ---------- E-mail (brand colours, works in Gmail on a phone) ----------
const F = "font-family:Helvetica,Arial,sans-serif;";
const card = "background:#fff;border:1px solid #E7C7D1;border-radius:8px;padding:16px 20px;margin:0 0 12px;";
const h = (t) => `<div style="${F}font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#683A46;font-weight:600;margin:0 0 8px">${esc(t)}</div>`;
const row = (a, b, strong = false, color = "#3C0E18") => `<tr><td style="${F}padding:5px 0;font-size:14px;color:#683A46">${esc(a)}</td><td style="${F}padding:5px 0;font-size:14px;text-align:right;color:${color};${strong ? "font-weight:700" : ""}">${esc(b)}</td></tr>`;
const table = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`;
const kpi = (label, value, sub) => `<td style="${F}padding:10px 6px;text-align:center;border:1px solid #E7C7D1;border-radius:8px;background:#fff"><div style="font-size:22px;font-weight:700;color:#3C0E18">${esc(value)}</div><div style="font-size:11px;color:#683A46;text-transform:uppercase;letter-spacing:1px">${esc(label)}</div>${sub ? `<div style="font-size:11px;color:#7A2B3C;margin-top:4px">${esc(sub)}</div>` : ""}</td>`;
const note = (t, bg = "#FFE1ED") => `<div style="${F}${card}background:${bg};font-size:14px;color:#3C0E18">${t}</div>`;

const s = [];
s.push(`<table role="presentation" width="100%" cellspacing="6" style="margin:0 0 12px"><tr>${kpi("orders", C.orders, change(C.orders, P.orders))}${kpi("pieces", C.pieces, change(C.pieces, P.pieces))}${kpi("total", egp(C.total), change(C.total, P.total, true))}</tr></table>`);

// Things to act on first.
if (d.waiting.count) s.push(note(`<b>${plural(d.waiting.count, "order")} waiting for confirmation.</b> Call or WhatsApp each customer: ${esc(d.waiting.numbers.join(", "))}`));
if (low.length) s.push(note(`<b>Low stock (${LOW} or fewer):</b> ${esc(low.map((x) => `${x.color} ${x.size}: ${x.available <= 0 ? "SOLD OUT" : `${x.available} left`}`).join(" · "))}`));
if (!C.orders) s.push(note(`No orders ${N.period}. Check the ad is running (Meta Ads Manager) and visitors are arriving (Vercel → Analytics).`, "#F3F0E8"));

s.push(`<div style="${card}">${h(`Summary · ${N.period}`)}${table([
  row("Orders", C.orders, true),
  row("Pieces sold", C.pieces),
  row("Products", egp(C.subtotal)),
  row("Delivery fees", egp(C.delivery)),
  row("Total to collect", egp(C.total), true),
  row("Average order", C.orders ? egp(C.total / C.orders) : "—"),
  row(`Compared with ${N.prev}`, `${plural(P.orders, "order")} · ${egp(P.total)}`),
  row("Gave a second number", `${C.alt} of ${C.orders}`),
])}</div>`);
if (best) s.push(`<div style="${card}">${h("Best seller")}${table([row(`${best.color} ${best.size}`, `${best.qty} pcs · ${egp(best.value)}`, true)])}</div>`);
if (d.byItem.length > 1) s.push(`<div style="${card}">${h("What sold")}${table(d.byItem.map((r) => row(`${r.color} ${r.size}`, `${r.qty} pcs · ${egp(r.value)}`)))}</div>`);
if (d.byPrice.length) s.push(`<div style="${card}">${h("Price paid per piece")}${table(d.byPrice.map((r) => row(egp(r.unit), `${r.qty} pcs`)))}</div>`);
if (d.byArea.length) s.push(`<div style="${card}">${h("Where to")}${table(d.byArea.map((r) => row(r.area, `${plural(r.orders, "order")} · ${egp(r.total)}`)))}</div>`);
if (mode !== "daily" && d.byDay.length) s.push(`<div style="${card}">${h("Day by day")}${table(d.byDay.map((r) => row(r.day, `${r.orders} · ${egp(r.total)}`)))}</div>`);
if (d.byHour.length) s.push(`<div style="${card}">${h("When people order (Cairo time)")}${table(d.byHour.map((r) => row(`${String(r.hour).padStart(2, "0")}:00`, "▮".repeat(Math.min(r.orders, 20)) + ` ${r.orders}`)))}</div>`);
if (mode === "daily" && d.list.length) s.push(`<div style="${card}">${h("Orders")}${table(d.list.map((o) => row(`${o.time.split(" ")[1]} · ${o.number} · ${o.area}`, `${o.items} · ${egp(o.total)}`)))}</div>`);
s.push(`<div style="${card}">${h("Stock now")}${table(d.stock.map((x) => row(`${x.color} ${x.size}`, x.tracked ? (x.available <= 0 ? "SOLD OUT" : `${x.available} left`) : "not counted", x.tracked && x.available <= LOW, x.tracked && x.available <= LOW ? "#7A2B3C" : "#3C0E18")))}</div>`);
s.push(`<div style="${card}">${h("Since the shop opened")}${table([row("Orders", d.allTime.orders), row("Total", egp(d.allTime.total))])}</div>`);
s.push(`<p style="${F}font-size:12px;color:#683A46;text-align:center;line-height:1.6">Visitors and the shop steps (viewed → added to bag → checkout → order): Vercel → nuriya-store → Analytics → Events.<br>Ad results: Meta Ads Manager. Daily at 9:00 · weekly on Sunday · monthly on the 1st.</p>`);

const html = `<!doctype html><html><body style="margin:0;background:#FFF0F6;padding:16px"><div style="max-width:560px;margin:auto">
<h2 style="${F}font-weight:600;color:#3C0E18;margin:4px 0 2px">${esc(N.title)}</h2><p style="${F}margin:0 0 14px;color:#683A46;font-size:13px">${esc(N.when)} · Cairo time</p>
${s.join("\n")}</div></body></html>`;

const text = [
  subject, "",
  `${N.period.toUpperCase()}: ${plural(C.orders, "order")} · ${C.pieces} pcs · ${egp(C.total)}  (${N.prev}: ${P.orders} · ${egp(P.total)})`,
  d.waiting.count ? `TO CONFIRM: ${d.waiting.numbers.join(", ")}` : "TO CONFIRM: none",
  low.length ? `LOW STOCK: ${low.map((x) => `${x.color} ${x.size} ${x.available}`).join(", ")}` : "LOW STOCK: none", "",
  "WHAT SOLD", ...(d.byItem.length ? d.byItem.map((r) => `  ${r.color} ${r.size}: ${r.qty} pcs`) : ["  —"]), "",
  "WHERE TO", ...(d.byArea.length ? d.byArea.map((r) => `  ${r.area}: ${r.orders}`) : ["  —"]), "",
  "STOCK", ...d.stock.map((x) => `  ${x.color} ${x.size}: ${x.available}`), "",
  `SINCE OPENING: ${d.allTime.orders} orders · ${egp(d.allTime.total)}`,
].join("\n");
console.log(text);
writeFileSync("report.txt", text + "\n");

if (!(await sendReport({ kind: "sales", subject, html, text }))) process.exitCode = 1;
