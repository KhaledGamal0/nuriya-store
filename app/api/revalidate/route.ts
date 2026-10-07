import { timingSafeEqual } from "node:crypto";
import { refreshStorefront } from "@/lib/refresh";

// POST /api/revalidate with header "Authorization: Bearer <REVALIDATE_SECRET>".
// Used after editing the database directly; the admin dashboard will refresh pages by itself.
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const ok =
    Boolean(secret) &&
    given.length === secret!.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(secret!));
  if (!ok) return Response.json({ error: "Not allowed" }, { status: 401 });
  refreshStorefront();
  return Response.json({ refreshed: true, at: new Date().toISOString() });
}
