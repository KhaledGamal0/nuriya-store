import { timingSafeEqual } from "node:crypto";
import { refreshStorefront } from "@/lib/refresh";
import { redeemOneTimeToken as oneTimeToken } from "@/lib/one-time-token";

// POST /api/revalidate with "Authorization: Bearer <secret>". Accepted secrets:
//  - REVALIDATE_SECRET (Vercel only), or
//  - a one-time token that a trusted job just wrote to the refresh_tokens table (valid 10 minutes, used once).
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const bySecret = Boolean(secret) && given.length === secret!.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret!));
  if (!bySecret && !(await oneTimeToken(given))) return Response.json({ error: "Not allowed" }, { status: 401 });
  refreshStorefront();
  return Response.json({ refreshed: true, at: new Date().toISOString() });
}
