import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSql, hasDatabase } from "@/lib/db";
import { renderSales } from "@/scripts/sales-render.mjs";

// GET /api/cron/reports — called by Vercel Cron every 10 minutes (vercel.json). Sends the sales reports on time
// in Cairo time (Khaled, Oct 30 2026: GitHub's scheduler started the reports clock hours late or not at all):
//   daily 09:00 (yesterday) · Sunday 09:00 weekly · the 1st 09:00 monthly.
// Each report is sent once (report_runs; the GitHub clock uses the same table, so the two never double-send).
// Safe if called by anyone: it only ever sends a report that is due, once, to the shop's own inbox.
export const dynamic = "force-dynamic";

type Kind = "sales-daily" | "sales-weekly" | "sales-monthly";
const MODE: Record<Kind, "daily" | "weekly" | "monthly"> = { "sales-daily": "daily", "sales-weekly": "weekly", "sales-monthly": "monthly" };

function cairoNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), sunday: p.weekday === "Sun", first: p.day === "01" };
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  if (!hasDatabase()) return Response.json({ sent: [] });
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!key || !to) return Response.json({ error: "E-mail not set up" }, { status: 503 });

  const now = cairoNow();
  const due: Kind[] = [];
  if (now.hour >= 9) due.push("sales-daily");
  if (now.hour >= 9 && now.sunday) due.push("sales-weekly");
  if (now.hour >= 9 && now.first) due.push("sales-monthly");

  const sql = getSql();
  const sent: string[] = [];
  for (const kind of due) {
    const claimed = await sql`INSERT INTO report_runs (kind, period) VALUES (${kind}, ${now.date}) ON CONFLICT DO NOTHING RETURNING 1`;
    if (!claimed.length) continue;
    try {
      // The same SQL file the GitHub job uses; the mode comes from our own fixed list, never from the request.
      const file = await readFile(path.join(process.cwd(), "scripts/sales.sql"), "utf8");
      const query = file.replaceAll(":'mode'", `'${MODE[kind]}'`);
      const rows = await sql.unsafe(query);
      const data = Object.values(rows[0] ?? {})[0];
      const { subject, html, text } = renderSales(typeof data === "string" ? JSON.parse(data) : data);
      const from = process.env.ORDER_EMAIL_FROM?.replace(/^[^<]*</, "Nuriya sales <") || "Nuriya sales <onboarding@resend.dev>";
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
      });
      if (!r.ok) throw new Error(`resend ${r.status}`);
      sent.push(kind);
      console.info("report.sent", kind, now.date);
    } catch (e) {
      // Not sent: free the slot so the next run (10 minutes later) tries again.
      await sql`DELETE FROM report_runs WHERE kind = ${kind} AND period = ${now.date}`;
      console.error("report.failed", kind, e instanceof Error ? e.message : "error");
    }
  }
  return Response.json({ cairo: now, sent });
}
