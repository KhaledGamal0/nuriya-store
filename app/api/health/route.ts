import { sql } from "drizzle-orm";
import { getDb, hasDatabase } from "@/lib/db";
import { emailConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Public status check. Shows only whether the database is reachable — never addresses or secrets. */
export async function GET(): Promise<Response> {
  if (!hasDatabase()) return Response.json({ ok: true, database: "not configured", source: "built-in data" });
  try {
    const t0 = Date.now();
    const rows = await getDb().execute(sql`SELECT (SELECT count(*) FROM variants)::int AS variants, (SELECT count(*) FROM shipping_areas)::int AS areas`);
    const r = (rows as unknown as { variants: number; areas: number }[])[0];
    return Response.json({
      ok: true,
      database: "connected",
      source: "database",
      seeded: (r?.variants ?? 0) > 0,
      email: emailConfigured() ? "configured" : "not configured",
      ms: Date.now() - t0,
    });
  } catch {
    return Response.json({ ok: false, database: "error" }, { status: 503 });
  }
}
