import { redeemOneTimeToken } from "@/lib/one-time-token";

// POST /api/report-mail — the nightly sales report and the health report (made on GitHub) are e-mailed
// through the site, which already holds the Resend key. Only a one-time pass that the GitHub job just wrote
// to the database is accepted, and mail only ever goes to ORDER_ALERT_EMAIL (the shop's own inbox).
const KINDS = { sales: "Nuriya sales", health: "Nuriya health" } as const;

export async function POST(request: Request): Promise<Response> {
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!(await redeemOneTimeToken(given))) return Response.json({ error: "Not allowed" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = body?.kind;
  const subject = body?.subject;
  const html = body?.html;
  const text = body?.text;
  const ok =
    (kind === "sales" || kind === "health") &&
    typeof subject === "string" && subject.length > 0 && subject.length <= 200 &&
    typeof html === "string" && html.length <= 300_000 &&
    typeof text === "string" && text.length <= 100_000;
  if (!ok) return Response.json({ error: "Bad report" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!key || !to) return Response.json({ error: "E-mail not set up on the site" }, { status: 503 });

  const from = process.env.ORDER_EMAIL_FROM?.replace(/^[^<]*</, `${KINDS[kind]} <`) || `${KINDS[kind]} <onboarding@resend.dev>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  return Response.json({ sent: r.ok, status: r.status }, { status: r.ok ? 200 : 502 });
}
