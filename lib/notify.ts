// New-order e-mail to the shop (Resend). Sent AFTER the order is safely saved, never before:
// if e-mail is down the order is still in the database, notified_at stays empty, the next order
// retries it (for up to 7 days, so a wrong setting fixed later still delivers every waiting order),
// and the hourly "Order watch" workflow raises a phone alert.
import type { Sql } from "./db/index.ts";
import { formatEgp } from "./money.ts";
import { siteUrl } from "./site.ts";

type Fetch = typeof fetch;

type OrderForEmail = {
  id: number;
  number: string;
  payment_method: "cod" | "card";
  customer_name: string;
  customer_phone: string;
  area_name: string;
  address: string;
  subtotal_piasters: number;
  shipping_piasters: number;
  total_piasters: number;
  created_at: Date | string;
  items: { product_name: string; color_name: string; size: string; qty: number; line_piasters: number; color_code?: string }[];
};

/** Stock left per colour and size, at the moment the e-mail is written. */
export type StockRow = { color: string; size: string; tracked: boolean; available: number };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_ALERT_EMAIL);
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);
const site = siteUrl;
const prettyPhone = (p: string) => (p.length === 11 ? `${p.slice(0, 3)} ${p.slice(3, 7)} ${p.slice(7)}` : p);

/** WhatsApp link that opens a chat with the customer, confirmation message already typed. */
export function whatsappLink(o: Pick<OrderForEmail, "number" | "customer_name" | "customer_phone" | "total_piasters" | "area_name" | "payment_method">): string {
  const first = o.customer_name.split(" ")[0];
  const pay = o.payment_method === "cod" ? "cash on delivery" : "paid by card";
  const text = `Hi ${first}, this is Nuriya. Thank you for your order ${o.number} (${formatEgp(o.total_piasters)}, ${pay}, delivery to ${o.area_name}). Can you confirm it so we prepare it for the courier?`;
  return `https://wa.me/2${o.customer_phone}?text=${encodeURIComponent(text)}`;
}

const LOW = 3;
const stockWord = (r: StockRow) => (!r.tracked ? "not counted" : r.available <= 0 ? "SOLD OUT" : r.available <= LOW ? `${r.available} left · low` : `${r.available} left`);

/** The shop's order e-mail: everything needed to confirm, pack and ship, plus stock left. Table layout and
 * inline styles so it looks the same in Gmail, Outlook and phone mail apps. */
export function orderEmail(o: OrderForEmail, stock: StockRow[] = []): { subject: string; text: string; html: string } {
  const cod = o.payment_method === "cod";
  const pay = cod ? "Cash on delivery" : "Card (paid online)";
  const pieces = o.items.reduce((n, i) => n + i.qty, 0);
  const subject = `New order ${o.number} · ${formatEgp(o.total_piasters)} · ${o.area_name}`;
  const wa = whatsappLink(o);
  const placed = new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const lowOrOut = stock.filter((r) => r.tracked && r.available <= LOW);

  const text = [
    `NEW ORDER ${o.number}`,
    `${placed} (Cairo) · ${pay} · ${pieces} piece${pieces === 1 ? "" : "s"}`,
    "",
    "ITEMS",
    ...o.items.map((i) => `  ${i.qty} × ${i.product_name} — ${i.color_name}, ${i.size} ........ ${formatEgp(i.line_piasters)}`),
    `  Subtotal ${formatEgp(o.subtotal_piasters)} · Delivery ${formatEgp(o.shipping_piasters)}`,
    `  TOTAL ${formatEgp(o.total_piasters)}${cod ? " — collect in cash" : ""}`,
    "",
    "CUSTOMER",
    `  ${o.customer_name}`,
    `  ${prettyPhone(o.customer_phone)}`,
    `  ${o.area_name} — ${o.address}`,
    "",
    `Confirm on WhatsApp: ${wa}`,
    ...(stock.length ? ["", "STOCK NOW", ...stock.map((r) => `  ${r.color} ${r.size}: ${stockWord(r)}`)] : []),
  ].join("\n");

  const F = "font-family:Poppins,Helvetica,Arial,sans-serif;";
  const muted = "color:#683A46;";
  const label = `${F}font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#683A46;font-weight:600;padding:0 0 8px;`;
  const card = "background:#ffffff;border:1px solid #E7C7D1;border-radius:8px;";
  const itemRows = o.items
    .map((i) => {
      const img = i.color_code ? `<img src="${site()}/email/thumb-${esc(i.color_code)}.jpg" width="64" height="80" alt="" style="display:block;border-radius:6px;object-fit:cover">` : "";
      return `<tr>
<td width="76" valign="top" style="padding:12px 12px 12px 0">${img}</td>
<td valign="top" style="${F}padding:12px 0;font-size:14px;color:#3C0E18"><b style="font-weight:600">${esc(i.product_name)}</b><br><span style="${muted}">${esc(i.color_name)} · ${esc(i.size)}</span><br><span style="${muted}">Qty ${i.qty}</span></td>
<td valign="top" align="right" style="${F}padding:12px 0;font-size:14px;color:#3C0E18;white-space:nowrap">${formatEgp(i.line_piasters)}</td></tr>`;
    })
    .join("");
  const money = (k: string, v: string, strong = false) =>
    `<tr><td style="${F}padding:4px 0;font-size:${strong ? 16 : 14}px;color:#3C0E18;${strong ? "font-weight:700" : ""}">${k}</td><td align="right" style="${F}padding:4px 0;font-size:${strong ? 16 : 14}px;color:#3C0E18;${strong ? "font-weight:700" : ""};white-space:nowrap">${v}</td></tr>`;
  const info = (k: string, v: string) =>
    `<tr><td width="90" valign="top" style="${F}padding:5px 0;font-size:13px;${muted}">${k}</td><td style="${F}padding:5px 0;font-size:14px;color:#3C0E18">${v}</td></tr>`;
  const stockRows = stock
    .map((r) => {
      const color = !r.tracked ? "#683A46" : r.available <= 0 ? "#9B1C2E" : r.available <= LOW ? "#7A2B3C" : "#3C0E18";
      return `<tr><td style="${F}padding:6px 0;font-size:14px;color:#3C0E18;border-top:1px solid #F3E3E9">${esc(r.color)} · ${esc(r.size)}</td><td align="right" style="${F}padding:6px 0;font-size:14px;font-weight:${r.tracked && r.available <= LOW ? 700 : 500};color:${color};border-top:1px solid #F3E3E9">${esc(stockWord(r))}</td></tr>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#FFF0F6">
<div style="display:none;max-height:0;overflow:hidden">${esc(`${formatEgp(o.total_piasters)} · ${o.customer_name} · ${o.area_name}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF0F6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="padding:8px 0 20px"><img src="${site()}/email/logo.png" width="120" height="40" alt="Nuriya" style="display:block;border:0"></td></tr>

<tr><td style="${card}padding:24px">
  <div style="${label}">New order · ${esc(placed)}</div>
  <div style="${F}font-size:28px;font-weight:600;letter-spacing:1px;color:#3C0E18;padding:0 0 6px">${esc(o.number)}</div>
  <div style="${F}font-size:14px;${muted}padding:0 0 18px">${pay} · ${pieces} piece${pieces === 1 ? "" : "s"} · <b style="color:#3C0E18">${formatEgp(o.total_piasters)}</b></div>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="border-radius:8px;background:#3C0E18"><a href="${esc(wa)}" style="${F}display:inline-block;padding:13px 20px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">Confirm on WhatsApp</a></td>
    <td width="8"></td>
    <td style="border-radius:8px;border:1px solid #3C0E18"><a href="tel:${esc(o.customer_phone)}" style="${F}display:inline-block;padding:12px 18px;font-size:14px;font-weight:600;color:#3C0E18;text-decoration:none">Call</a></td>
  </tr></table>
</td></tr>
<tr><td height="12"></td></tr>

<tr><td style="${card}padding:20px 24px">
  <div style="${label}">Deliver to</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${info("Name", `<b style="font-weight:600">${esc(o.customer_name)}</b>`)}
    ${info("Phone", `<a href="tel:${esc(o.customer_phone)}" style="color:#3C0E18">${esc(prettyPhone(o.customer_phone))}</a>`)}
    ${info("Area", esc(o.area_name))}
    ${info("Address", esc(o.address))}
    ${info("Payment", cod ? `<b style="font-weight:600">Collect ${formatEgp(o.total_piasters)} in cash</b>` : "Paid by card")}
  </table>
</td></tr>
<tr><td height="12"></td></tr>

<tr><td style="${card}padding:20px 24px">
  <div style="${label}">Items</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E7C7D1;margin-top:4px;padding-top:8px">
    ${money("Subtotal", formatEgp(o.subtotal_piasters))}${money("Delivery", formatEgp(o.shipping_piasters))}${money("Total", formatEgp(o.total_piasters), true)}
  </table>
</td></tr>
${
  stock.length
    ? `<tr><td height="12"></td></tr>
<tr><td style="${card}padding:20px 24px">
  <div style="${label}">Stock now${lowOrOut.length ? ` · <span style="color:#9B1C2E">${lowOrOut.length} size${lowOrOut.length === 1 ? "" : "s"} low or sold out</span>` : ""}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stockRows}</table>
</td></tr>`
    : ""
}
<tr><td style="${F}padding:20px 8px 0;font-size:12px;${muted}text-align:center;line-height:1.6">
  Saved safely in the shop database. Change stock any time: GitHub → Actions → Admin tasks.
</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

async function loadOrder(sql: Sql, id: number): Promise<OrderForEmail | null> {
  const [o] = await sql<Omit<OrderForEmail, "items">[]>`
    SELECT id, number, payment_method, customer_name, customer_phone, area_name, address,
           subtotal_piasters, shipping_piasters, total_piasters, created_at
    FROM orders WHERE id = ${id}`;
  if (!o) return null;
  const items = await sql<OrderForEmail["items"]>`
    SELECT i.product_name, i.color_name, i.size, i.qty, i.line_piasters, c.code AS color_code
    FROM order_items i JOIN variants v ON v.id = i.variant_id JOIN colorways c ON c.id = v.colorway_id
    WHERE i.order_id = ${id} ORDER BY i.id`;
  return { ...o, items: [...items] };
}

export async function stockNow(sql: Sql): Promise<StockRow[]> {
  const rows = await sql<StockRow[]>`
    SELECT c.name_en AS color, v.size, v.track_inventory AS tracked, (v.stock_on_hand - v.stock_reserved)::int AS available
    FROM variants v JOIN colorways c ON c.id = v.colorway_id
    WHERE v.is_active AND c.is_active
    ORDER BY c.position, v.size DESC`;
  return [...rows];
}

/**
 * Send e-mails for orders that don't have one yet (oldest first, a few at a time).
 * Rows are claimed with SKIP LOCKED, so two servers never e-mail the same order twice.
 */
export async function sendPendingOrderEmails(sql: Sql, opts: { limit?: number; fetcher?: Fetch } = {}): Promise<{ sent: number; failed: number }> {
  if (!emailConfigured()) return { sent: 0, failed: 0 };
  const fetcher = opts.fetcher ?? fetch;
  let sent = 0;
  let failed = 0;
  await sql.begin(async (tx) => {
    const due = await tx<{ id: number }[]>`
      SELECT id FROM orders
      WHERE notified_at IS NULL AND notify_attempts < 200 AND created_at > now() - interval '7 days'
      ORDER BY created_at
      LIMIT ${opts.limit ?? 5}
      FOR UPDATE SKIP LOCKED`;
    for (const { id } of due) {
      const order = await loadOrder(tx as unknown as Sql, id);
      if (!order) continue;
      const mail = orderEmail(order, await stockNow(tx as unknown as Sql));
      let ok = false;
      try {
        const res = await fetcher("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json", "idempotency-key": `order-${order.number}` },
          body: JSON.stringify({
            from: process.env.ORDER_EMAIL_FROM || "Nuriya orders <onboarding@resend.dev>",
            to: [process.env.ORDER_ALERT_EMAIL],
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          }),
          signal: AbortSignal.timeout(8000),
        });
        ok = res.ok;
        if (!ok) console.error("order.email.failed", order.number, res.status);
      } catch (err) {
        console.error("order.email.failed", order.number, err instanceof Error ? err.message : err);
      }
      if (ok) {
        sent++;
        await tx`UPDATE orders SET notified_at = now(), notify_attempts = notify_attempts + 1 WHERE id = ${id}`;
        await tx`INSERT INTO order_events (order_id, type) VALUES (${id}, 'shop_emailed')`;
      } else {
        failed++;
        await tx`UPDATE orders SET notify_attempts = notify_attempts + 1 WHERE id = ${id}`;
      }
    }
  });
  return { sent, failed };
}
