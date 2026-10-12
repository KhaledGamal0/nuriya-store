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

/** Start-up snippet (inline, runs before the page starts): a tiny queue + init + first PageView. */
export const fbInit = (id: string) =>
  `!function(f,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window);fbq('init','${id}');fbq('track','PageView');`;


/** A unique id per event, shared by the browser Pixel and its server copy (so Meta keeps one). */
function newEventId(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

const PREFIX: Record<string, string> = { ViewContent: "vc", AddToCart: "atc", InitiateCheckout: "ic" };

/**
 * Browser Pixel event + the same event from the server (Conversions API), sharing one event id.
 * The server copy is a tiny background note (sendBeacon) that never delays the page. Only on the live
 * site (where the Pixel exists); local and test runs send nothing.
 */
export function pixelBoth(event: "ViewContent" | "AddToCart" | "InitiateCheckout", params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (!(window as unknown as { fbq?: Fbq }).fbq) return;
    const eventId = newEventId(PREFIX[event] ?? "ev");
    pixel(event, params, eventId);
    const note = JSON.stringify({ name: event, eventId, path: location.pathname, custom: params });
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
export const fbCookies = `(function(){try{var d=document,n=Date.now(),m=/(?:^|; )_fbc=([^;]*)/.exec(d.cookie),q=new URLSearchParams(location.search).get('fbclid'),a='; path=/; max-age=7776000; SameSite=Lax; Secure';if(q&&!(m&&m[1].split('.').slice(3).join('.')===q))d.cookie='_fbc=fb.1.'+n+'.'+q+a;if(!/(?:^|; )_fbp=/.test(d.cookie))d.cookie='_fbp=fb.1.'+n+'.'+Math.floor(Math.random()*9e9+1e9)+a}catch(e){}})()`;

/**
 * Advanced Matching: tell the Pixel who bought (phone + name), so Meta can match the order to her
 * Instagram/Facebook account. The Pixel hashes these on the phone before sending; we never send them raw.
 * Called on the thank-you page, just before Purchase.
 */
export async function pixelCustomer(phone: string, fullName: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (!fbq) return;
    const d = phone.replace(/\D/g, "");
    const parts = fullName.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const data: Record<string, string> = { country: "eg" };
    if (/^01\d{9}$/.test(d)) data.ph = `2${d}`;
    if (parts[0]) data.fn = parts[0];
    const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
    if (last) data.ln = last;
    // external_id: the same scrambled phone the server sends, so browser and server events join up.
    if (data.ph && crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.ph));
      data.external_id = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    fbq("init", META_PIXEL_ID, data);
  } catch {}
}
