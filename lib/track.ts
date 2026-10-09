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

export function track(name: string, detail: string | number = "-"): void {
  if (typeof window === "undefined") return;
  const city = knownPlace();
  if (city) send({ name, data: { detail: String(detail), city } });
  else waiting.push({ name, detail: String(detail) }); // sent as soon as the city is known (within a few seconds)
}
