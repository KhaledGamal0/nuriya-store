import { timingSafeEqual } from "node:crypto";
import { refreshStorefront } from "@/lib/refresh";
import { getSql, hasDatabase } from "@/lib/db";

// POST /api/revalidate with "Authorization: Bearer <secret>". Accepted secrets:
//  - REVALIDATE_SECRET (Vercel only), or
//  - a one-time token that a trusted job just wrote to the refresh_tokens table (valid 10 minutes, used once).
async function oneTimeToken(given: string): Promise<boolean> {
  if (!hasDatabase() || given.length < 32 || given.length > 128) return false;
  try {
    const sql = getSql();
    await sql`DELETE FROM refresh_tokens WHERE created_at < now() - interval '1 day'`;
    const used = await sql`DELETE FROM refresh_tokens WHERE token = ${given} AND created_at > now() - interval '10 minutes' RETURNING token`;
    return used.length === 1;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const bySecret = Boolean(secret) && given.length === secret!.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret!));
  if (!bySecret && !(await oneTimeToken(given))) return Response.json({ error: "Not allowed" }, { status: 401 });
  refreshStorefront();
  return Response.json({ refreshed: true, at: new Date().toISOString() });
}
