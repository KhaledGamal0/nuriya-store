/**
 * Meta Pixel (for Khaled's Instagram/Facebook ads). The Pixel ID is public by design (it is in every page's HTML).
 * The Meta script loads only on Vercel, after the page has finished loading, so it never slows the first screen.
 * Events wait in fbq's queue until the script arrives. Prices are sent in EGP (not piasters).
 */
export const META_PIXEL_ID = "4517203408538944";

type Fbq = ((...a: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...a: unknown[]) => void };

export function pixel(event: string, params: Record<string, unknown> = {}, eventID?: string): void {
  if (typeof window === "undefined") return;
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (!fbq) return; // not on Vercel (local, CI): no Pixel
    if (eventID) fbq("track", event, params, { eventID });
    else fbq("track", event, params);
  } catch {}
}

export const egp = (piasters: number) => Math.round(piasters) / 100;

/**
 * Start-up snippet (inline, runs before the page starts): a tiny queue + init with the visitor id (external_id).
 * Every PageView, the first included, is sent by components/MetaPixel.tsx with an event id and a server copy.
 */
export const fbInit = (id: string) =>
  `!function(f,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window);var v=/(?:^|; )nuriya_vid=([0-9a-f]{64})/.exec(document.cookie);fbq('init','${id}',v?{external_id:v[1]}:{});`;

/**
 * Anonymous visitor id (Khaled, Oct 25 2026): 64 random hex characters in a first-party cookie (1 year), set by the
 * start-up snippet. Sent to Meta as external_id on every event (browser and server), so all of one visitor's
 * events join up. Random, not derived from anything about her.
 */
const VID_COOKIE = "nuriya_vid";
export function visitorId(): string | undefined {
  try {
    const m = new RegExp(`(?:^|; )${VID_COOKIE}=([0-9a-f]{64})`).exec(document.cookie);
    return m?.[1];
  } catch {
    return undefined;
  }
}


/** A unique id per event, shared by the browser Pixel and its server copy (so Meta keeps one). */
function newEventId(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** A returning buyer's id (SHA-256 of her phone, saved on this phone at her last order). Never the phone itself. */
const XID_KEY = "nuriya-xid";
function returningId(): string | undefined {
  try {
    const v = localStorage.getItem(XID_KEY);
    return v && /^[0-9a-f]{64}$/.test(v) ? v : undefined;
  } catch {
    return undefined;
  }
}


/** What she typed at checkout, for Advanced Matching (the Pixel scrambles it on the phone before sending). */
export type CheckoutCustomer = { phone: string; name: string; area?: string };

/** Meta's matching fields: ph (20XXXXXXXXXX), fn, ln, st/ct (from the delivery area), country. Plain; the Pixel hashes. */
function matchData(c: CheckoutCustomer): Record<string, string> {
  const d = c.phone.replace(/\D/g, "");
  const parts = c.name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const data: Record<string, string> = { country: "eg" };
  if (/^01\d{9}$/.test(d)) data.ph = `2${d}`;
  if (parts[0]) data.fn = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  if (last) data.ln = last;
  if (c.area) {
    const a = c.area.toLowerCase();
    const st = a.startsWith("cairo") ? "cairo" : a.replace("countryside", "").replace(/[^a-z]/g, "");
    if (st) data.st = st;
    if (st && !a.includes("countryside")) data.ct = st;
  }
  return data;
}

const PREFIX: Record<string, string> = { PageView: "pv", ViewContent: "vc", AddToCart: "atc", InitiateCheckout: "ic" };

/**
 * Browser Pixel event + the same event from the server (Conversions API), sharing one event id.
 * The server copy is a tiny background note (sendBeacon) that never delays the page. Only on the live
 * site (where the Pixel exists); local and test runs send nothing.
 */
export function pixelBoth(event: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout", params: Record<string, unknown>, customer?: CheckoutCustomer): void {
  if (typeof window === "undefined") return;
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (!fbq) return;
    const eventId = newEventId(PREFIX[event] ?? "ev");
    // InitiateCheckout with what she typed (Khaled, Oct 23 2026): Advanced Matching first, then the event.
    const vid = visitorId();
    if (customer) fbq("init", META_PIXEL_ID, { ...matchData(customer), ...(vid && { external_id: vid }) });
    pixel(event, params, eventId);
    const xid = returningId();
    const user = customer ? { phone: customer.phone.replace(/\D/g, ""), name: customer.name.trim(), ...(customer.area && { area: customer.area }) } : undefined;
    const note = JSON.stringify({ name: event, eventId, path: location.pathname, custom: params, ...(vid && { vid }), ...(xid && { xid }), ...(user && { user }) });
    const blob = new Blob([note], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/meta-event", blob)) {
      void fetch("/api/meta-event", { method: "POST", body: note, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {}
}

/**
 * Ad clicks: Instagram/Facebook add ?fbclid=… to the link. Meta's own script turns it into the _fbc cookie,
 * but it loads late (for speed), so a visitor who leaves quickly would be lost. This tiny start-up snippet
 * saves _fbc (and the _fbp browser id) at once, in Meta's own format, so every event can be matched to the ad.
 */
export const fbCookies = `(function(){try{var d=document,n=Date.now(),m=/(?:^|; )_fbc=([^;]*)/.exec(d.cookie),q=new URLSearchParams(location.search).get('fbclid'),a='; path=/; max-age=7776000; SameSite=Lax; Secure';if(q&&!(m&&m[1].split('.').slice(3).join('.')===q))d.cookie='_fbc=fb.1.'+n+'.'+q+a;if(!/(?:^|; )_fbp=/.test(d.cookie))d.cookie='_fbp=fb.1.'+n+'.'+Math.floor(Math.random()*9e9+1e9)+a;var v=/(?:^|; )nuriya_vid=([0-9a-f]{64})/.exec(d.cookie),h='';if(v)h=v[1];else{var r=new Uint8Array(32);crypto.getRandomValues(r);for(var i=0;i<32;i++)h+=(r[i]+256).toString(16).slice(1)}d.cookie='nuriya_vid='+h+'; path=/; max-age=31536000; SameSite=Lax; Secure'}catch(e){}})()`;

/**
 * Advanced Matching: tell the Pixel who bought (phone + name), so Meta can match the order to her
 * Instagram/Facebook account. The Pixel hashes these on the phone before sending; we never send them raw.
 * Called on the thank-you page, just before Purchase.
 */
export async function pixelCustomer(phone: string, fullName: string, area?: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (!fbq) return;
    const data = matchData({ phone, name: fullName, area });
    // Her scrambled phone, saved on this phone so the server can add it to her next visits' events (2nd external_id).
    if (data.ph && crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.ph));
      try {
        localStorage.setItem(XID_KEY, [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""));
      } catch {}
    }
    const vid = visitorId();
    fbq("init", META_PIXEL_ID, { ...data, ...(vid && { external_id: vid }) });
  } catch {}
}
