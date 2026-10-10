/**
 * Shop events for the visitor stats (Vercel Web Analytics custom events). No cookies, no IP, no personal data.
 * Every event carries two details (the Vercel Pro maximum):
 *   detail — what happened, e.g. "White · S/M"
 *   city   — where the visitor is, e.g. "Nasr City · Cairo" (approximate, from the network, looked up once per visit)
 * so in Vercel → Analytics → Events every action can be split by city.
 */
type Payload = { name: string; data: { detail: string; city: string } };

const PLACE_KEY = "nuriya-place";
let place: string | null = null;
let waiting: { name: string; detail: string }[] = [];

function send(p: Payload) {
  try {
    // Before the stats script has loaded, events wait in its queue.
    const w = window as unknown as { va?: (...a: unknown[]) => void; vaq?: unknown[][] };
    w.va ??= (...a: unknown[]) => void (w.vaq ??= []).push(a);
    w.va("event", p);
  } catch {}
}

/** Called once the visitor's city is known (or after a short wait, as "Unknown"): sends any waiting events. */
export function setPlace(city: string) {
  place = city;
  try {
    sessionStorage.setItem(PLACE_KEY, city);
  } catch {}
  for (const e of waiting) send({ name: e.name, data: { detail: e.detail, city } });
  waiting = [];
}

export function knownPlace(): string | null {
  if (place) return place;
  try {
    place = sessionStorage.getItem(PLACE_KEY);
  } catch {}
  return place;
}

/**
 * Each action counts once per visit (same event + same detail), so reloading a page or opening the same
 * product again doesn't inflate the numbers: a count means "visits that did this". Problems are the
 * exception: every time someone gets stuck is worth knowing.
 */
function firstTimeThisVisit(name: string, detail: string): boolean {
  // Problems count every time; orders are already counted once per order number on the thank-you page.
  if (name.startsWith("Problem") || name.startsWith("7 ·")) return true;
  try {
    const key = "nuriya-ev";
    const seen: string[] = JSON.parse(sessionStorage.getItem(key) || "[]");
    const id = `${name}|${detail}`;
    if (seen.includes(id)) return false;
    seen.push(id);
    sessionStorage.setItem(key, JSON.stringify(seen.slice(-200)));
  } catch {}
  return true;
}

export function track(name: string, detail: string | number = "-"): void {
  if (typeof window === "undefined") return;
  if (!firstTimeThisVisit(name, String(detail))) return;
  const city = knownPlace();
  if (city) send({ name, data: { detail: String(detail), city } });
  else waiting.push({ name, detail: String(detail) }); // sent as soon as the city is known (within a few seconds)
}
