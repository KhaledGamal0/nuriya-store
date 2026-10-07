// New-order e-mail to the shop (Resend). Sent AFTER the order is safely saved, never before:
// if e-mail is down the order is still in the database, notified_at stays empty, the next order
// retries it (for up to 7 days, so a wrong setting fixed later still delivers every waiting order),
// and the hourly "Order watch" workflow raises a phone alert.
import type { Sql } from "./db/index.ts";
import { formatEgp } from "./money.ts";

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
  items: { product_name: string; color_name: string; size: string; qty: number; line_piasters: number }[];
};

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_ALERT_EMAIL);
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

/** WhatsApp link that opens a chat with the customer, confirmation message already typed. */
export function whatsappLink(o: Pick<OrderForEmail, "number" | "customer_name" | "customer_phone" | "total_piasters" | "area_name" | "payment_method">): string {
  const first = o.customer_name.split(" ")[0];
  const pay = o.payment_method === "cod" ? "cash on delivery" : "paid by card";
  const text = `Hi ${first}, this is Nuriya. Thank you for your order ${o.number} (${formatEgp(o.total_piasters)}, ${pay}, delivery to ${o.area_name}). Can you confirm it so we prepare it for the courier?`;
  return `https://wa.me/2${o.customer_phone}?text=${encodeURIComponent(text)}`;
}

export function orderEmail(o: OrderForEmail): { subject: string; text: string; html: string } {
  const pay = o.payment_method === "cod" ? "Cash on delivery" : "Card";
  const subject = `New order ${o.number} · ${formatEgp(o.total_piasters)} · ${pay} · ${o.area_name}`;
  const lines = o.items.map((i) => `${i.qty} × ${i.product_name}, ${i.color_name}, ${i.size} — ${formatEgp(i.line_piasters)}`);
  const wa = whatsappLink(o);
  const placed = new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" });
  const text = [
    `New order ${o.number} — ${placed} (Cairo)`,
    "",
    ...lines,
    `Subtotal ${formatEgp(o.subtotal_piasters)} · Delivery ${formatEgp(o.shipping_piasters)} · Total ${formatEgp(o.total_piasters)}`,
    `Payment: ${pay}`,
    "",
    `${o.customer_name}`,
    `${o.customer_phone}`,
    `${o.area_name} — ${o.address}`,
    "",
    `Confirm on WhatsApp: ${wa}`,
  ].join("\n");
  const row = (k: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;color:#683A46">${k}</td><td style="padding:4px 0">${v}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;color:#3C0E18;font-size:15px;line-height:1.5;max-width:560px">
<p style="font-size:20px;margin:0 0 4px">New order ${esc(o.number)}</p>
<p style="margin:0 0 16px;color:#683A46">${esc(placed)} (Cairo) · ${pay}</p>
<ul style="padding-left:18px;margin:0 0 12px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<table style="border-collapse:collapse;margin-bottom:16px">
${row("Subtotal", formatEgp(o.subtotal_piasters))}${row("Delivery", formatEgp(o.shipping_piasters))}${row("<b>Total</b>", `<b>${formatEgp(o.total_piasters)}</b>`)}
${row("Name", esc(o.customer_name))}${row("Phone", `<a href="tel:${esc(o.customer_phone)}">${esc(o.customer_phone)}</a>`)}${row("Area", esc(o.area_name))}${row("Address", esc(o.address))}
</table>
<p><a href="${esc(wa)}" style="display:inline-block;background:#3C0E18;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none">Confirm on WhatsApp</a></p>
</div>`;
  return { subject, text, html };
}

async function loadOrder(sql: Sql, id: number): Promise<OrderForEmail | null> {
  const [o] = await sql<Omit<OrderForEmail, "items">[]>`
    SELECT id, number, payment_method, customer_name, customer_phone, area_name, address,
           subtotal_piasters, shipping_piasters, total_piasters, created_at
    FROM orders WHERE id = ${id}`;
  if (!o) return null;
  const items = await sql<OrderForEmail["items"]>`
    SELECT product_name, color_name, size, qty, line_piasters FROM order_items WHERE order_id = ${id} ORDER BY id`;
  return { ...o, items: [...items] };
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
      const mail = orderEmail(order);
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
