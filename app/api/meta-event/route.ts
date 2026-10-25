import { after } from "next/server";
import { cookies } from "next/headers";
import { parseClientEvent, sendServerEvents } from "@/lib/meta-capi";
import { siteUrl } from "@/lib/site";
import { allowIp } from "@/lib/ip-limit";

// POST /api/meta-event — the browser's background note for PageView / ViewContent / AddToCart / InitiateCheckout.
// The server forwards it to Meta (Conversions API) with the visitor's IP, browser and Meta cookies, using the
// same event_id as the browser Pixel, so Meta keeps one copy. Answers at once; Meta is called afterwards.
// Guards: our own site only, small body, only our three event names and known products, numbers range-checked.
const ALLOWED_HOSTS = new Set([new URL(siteUrl()).host, "nuriya.app", "www.nuriya.app"]);

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  let host = "";
  try {
    host = new URL(origin).host;
  } catch {}
  if (!ALLOWED_HOSTS.has(host)) return new Response(null, { status: 403 });
  if (!process.env.META_CAPI_TOKEN) return new Response(null, { status: 204 });
  // A real visitor sends a handful of these per visit; 60 a minute per device is far above that.
  const ipKey = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowIp(`meta:${ipKey}`, 60, 60_000)) return new Response(null, { status: 429 });
  const text = await request.text();
  if (text.length > 4000) return new Response(null, { status: 413 });
  let raw: unknown = null;
  try {
    raw = JSON.parse(text);
  } catch {}
  const e = parseClientEvent(raw);
  if (!e) return new Response(null, { status: 400 });

  const jar = await cookies();
  const visitor = {
    ip: request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
    fbp: jar.get("_fbp")?.value,
    fbc: jar.get("_fbc")?.value,
    externalId: e.externalId,
    // The cookie is the source of truth; the note's copy covers a browser that didn't send cookies.
    visitorId: /^[0-9a-f]{64}$/.test(jar.get("nuriya_vid")?.value ?? "") ? jar.get("nuriya_vid")!.value : e.visitorId,
    phone: e.user?.phone,
    name: e.user?.name,
    area: e.user?.area,
  };
  const url = `https://${host}${e.path}`;
  after(() =>
    sendServerEvents([{ name: e.name, eventId: e.eventId, url, visitor, custom: e.custom }]).catch((err) =>
      console.error("meta.capi.error", err instanceof Error ? err.name : "error"),
    ),
  );
  return new Response(null, { status: 204 });
}
