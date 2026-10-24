/**
 * Small per-visitor limit for public endpoints that need no database (kept in memory on each server instance).
 * Not exact across instances, which is fine: it stops one device from flooding an endpoint, at zero cost.
 */
const hits = new Map<string, { n: number; reset: number }>();

export function allowIp(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  return h.n <= max;
}
