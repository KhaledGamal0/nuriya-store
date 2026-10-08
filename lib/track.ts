/**
 * Shop events for the visitor stats (Vercel Web Analytics custom events). No cookies, no personal data:
 * only what was done (e.g. "Add to bag", colour, size). At most 2 details per event (Vercel Pro limit).
 * Safe to call anywhere: does nothing before the stats script loads, on the server, or when blocked.
 */
type Data = Record<string, string | number>;
export function track(name: string, data?: Data): void {
  if (typeof window === "undefined") return;
  try {
    // Events that happen before the stats script has loaded (e.g. on the first screen) wait in its queue.
    const w = window as unknown as { va?: (...a: unknown[]) => void; vaq?: unknown[][] };
    w.va ??= (...a: unknown[]) => void (w.vaq ??= []).push(a);
    w.va("event", data ? { name, data } : { name });
  } catch {}
}
