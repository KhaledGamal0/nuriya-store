// Sales report for Khaled: today and the last 7 days, from the orders database (Cairo time).
// Reads sales.json written by the workflow's SQL step. E-mails ORDER_ALERT_EMAIL. No customer phones.
import { readFileSync, writeFileSync } from "node:fs";

const d = JSON.parse(readFileSync("sales.json", "utf8"));
const egp = (p) => `${Math.round(p / 100).toLocaleString("en-US")} EGP`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const date = new Date().toLocaleDateString("en-GB", { timeZone: "Africa/Cairo", weekday: "short", day: "numeric", month: "short" });
const T = d.today, W = d.week;
const subject = `Nuriya sales · ${date} · ${T.orders} order${T.orders === 1 ? "" : "s"} today · ${egp(T.total)}`;

const F = "font-family:Helvetica,Arial,sans-serif;";
const card = "background:#fff;border:1px solid #E7C7D1;border-radius:8px;padding:16px 20px;margin:0 0 12px;";
const h = (t) => `<div style="${F}font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#683A46;font-weight:600;margin:0 0 8px">${t}</div>`;
const row = (a, b, strong = false) => `<tr><td style="${F}padding:5px 0;font-size:14px;color:#683A46">${esc(a)}</td><td style="${F}padding:5px 0;font-size:14px;text-align:right;color:#3C0E18;${strong ? "font-weight:700" : ""}">${esc(b)}</td></tr>`;
const table = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`;
const kpi = (label, value) => `<td style="${F}padding:8px;text-align:center;border:1px solid #E7C7D1;border-radius:8px"><div style="font-size:22px;font-weight:700;color:#3C0E18">${esc(value)}</div><div style="font-size:11px;color:#683A46;text-transform:uppercase;letter-spacing:1px">${label}</div></td>`;

const summary = (x) => [
  row("Orders", x.orders, true),
  row("Pieces sold", x.pieces),
  row("Products", egp(x.subtotal)),
  row("Delivery fees", egp(x.delivery)),
  row("Total to collect", egp(x.total), true),
  row("Average order", x.orders ? egp(x.total / x.orders) : "—"),
  row("Gave a second number", `${x.alt} of ${x.orders}`),
];

const sections = [];
sections.push(`<table role="presentation" width="100%" cellspacing="6" style="margin:0 0 12px"><tr>${kpi("orders today", T.orders)}${kpi("pieces today", T.pieces)}${kpi("today", egp(T.total))}</tr></table>`);
sections.push(`<div style="${card}">${h("Today")}${table(summary(T))}</div>`);
sections.push(`<div style="${card}">${h("Last 7 days")}${table(summary(W))}</div>`);
if (W.byItem.length) sections.push(`<div style="${card}">${h("What sold · last 7 days")}${table(W.byItem.map((r) => row(`${r.color} ${r.size}`, `${r.qty} pcs · ${egp(r.value)}`)))}</div>`);
if (W.byPrice.length) sections.push(`<div style="${card}">${h("Price paid per piece · last 7 days")}${table(W.byPrice.map((r) => row(egp(r.unit), `${r.qty} pcs`)))}</div>`);
if (W.byArea.length) sections.push(`<div style="${card}">${h("Where to · last 7 days")}${table(W.byArea.map((r) => row(r.area, `${r.orders} order${r.orders === 1 ? "" : "s"}`)))}</div>`);
if (T.byHour.length) sections.push(`<div style="${card}">${h("Orders by hour · today (Cairo)")}${table(T.byHour.map((r) => row(`${String(r.hour).padStart(2, "0")}:00`, "▮".repeat(Math.min(r.orders, 20)) + ` ${r.orders}`)))}</div>`);
if (W.byDay.length) sections.push(`<div style="${card}">${h("Orders per day")}${table(W.byDay.map((r) => row(r.day, `${r.orders} · ${egp(r.total)}`)))}</div>`);
if (T.list.length) sections.push(`<div style="${card}">${h("Today's orders")}${table(T.list.map((o) => row(`${o.time} · ${o.number} · ${o.area}`, `${o.items} · ${egp(o.total)}`)))}</div>`);
sections.push(`<div style="${card}">${h("Stock now")}${table(d.stock.map((s) => row(`${s.color} ${s.size}`, s.tracked ? (s.available <= 0 ? "SOLD OUT" : `${s.available} left`) : "not counted")))}</div>`);
sections.push(`<p style="${F}font-size:12px;color:#683A46;text-align:center">Visitors, where they came from and the shop funnel (Add to bag → Checkout started → Order placed): Vercel → nuriya-store → Analytics.</p>`);

const html = `<!doctype html><html><body style="margin:0;background:#FFF0F6;padding:16px"><div style="max-width:560px;margin:auto">
<h2 style="${F}font-weight:600;color:#3C0E18;margin:4px 0 2px">Sales report</h2><p style="${F}margin:0 0 14px;color:#683A46;font-size:13px">${esc(date)} · Cairo time</p>
${sections.join("\n")}</div></body></html>`;

const text = [subject, "", `TODAY: ${T.orders} orders · ${T.pieces} pcs · ${egp(T.total)}`, `7 DAYS: ${W.orders} orders · ${W.pieces} pcs · ${egp(W.total)}`, "",
  "WHAT SOLD (7 days)", ...W.byItem.map((r) => `  ${r.color} ${r.size}: ${r.qty} pcs`), "", "WHERE TO (7 days)", ...W.byArea.map((r) => `  ${r.area}: ${r.orders}`), "",
  "TODAY BY HOUR", ...T.byHour.map((r) => `  ${String(r.hour).padStart(2, "0")}:00  ${r.orders}`), "", "STOCK", ...d.stock.map((s) => `  ${s.color} ${s.size}: ${s.available}`)].join("\n");
console.log(text);
writeFileSync("report.txt", text + "\n");

const to = process.env.ORDER_ALERT_EMAIL;
if (process.env.RESEND_API_KEY && to) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.ORDER_EMAIL_FROM || "Nuriya sales <onboarding@resend.dev>", to: [to], subject, html, text }),
  });
  console.log(r.ok ? "::notice::Sales report e-mailed." : `::warning::E-mail failed: ${r.status}`);
} else console.log("::warning::RESEND_API_KEY / ORDER_ALERT_EMAIL missing: not e-mailed");
