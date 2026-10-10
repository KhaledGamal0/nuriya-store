import { getSql, hasDatabase } from "@/lib/db";

/**
 * A one-time pass that a trusted GitHub job just wrote to the refresh_tokens table
 * (only jobs holding the database key can write it). Valid 10 minutes, used once.
 */
export async function redeemOneTimeToken(given: string): Promise<boolean> {
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
