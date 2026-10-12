import { createHash } from "node:crypto";
import { META_PIXEL_ID } from "./pixel.ts";

/**
 * Meta Conversions API: the Purchase event is also sent from the server, so orders from phones that block
 * the browser Pixel (iPhone privacy, ad blockers, in-app browsers) still reach Meta. Same event_id as the
 * browser Purchase (the order number), so Meta counts each order once.
 * Runs AFTER the order is saved and the customer has their answer; any failure is logged and ignored.
 * Needs META_CAPI_TOKEN (Vercel env, server only). Without it nothing is sent.
 * Customer details are SHA-256 hashed here before they leave the server, as Meta requires.
 */
const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/** "01012345678" → "201012345678" (Meta wants country code, digits only). */
export function metaPhone(local: string): string | null {
  const d = local.replace(/\D/g, "");
  return /^01\d{9}$/.test(d) ? `2${d}` : null;
}

/** "Sara Ahmed Ali" → first "sara", last "ali" (letters only; Arabic names kept as written). */
export function metaName(full: string): { fn?: string; ln?: string } {
  const parts = full.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  return { fn: parts[0], ln: parts.length > 1 ? parts[parts.length - 1] : undefined };
}

export type ServerPurchase = {
  orderNumber: string;
  totalPiasters: number;
  lines: { color: string; qty: number; linePiasters: number }[];
  phone: string;
  name: string;
  ip: string | null;
  userAgent: string | null;
  fbp?: string;
  fbc?: string;
  url: string;
};

export async function sendServerPurchase(p: ServerPurchase): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;
  const version = process.env.META_GRAPH_VERSION || "v24.0";
  const ph = metaPhone(p.phone);
  const { fn, ln } = metaName(p.name);
  const user_data: Record<string, unknown> = {
    country: [sha("eg")],
    ...(ph && { ph: [sha(ph)], external_id: [sha(ph)] }),
    ...(fn && { fn: [sha(fn)] }),
    ...(ln && { ln: [sha(ln)] }),
    ...(p.ip && { client_ip_address: p.ip }),
    ...(p.userAgent && { client_user_agent: p.userAgent }),
    ...(p.fbp && { fbp: p.fbp }),
    ...(p.fbc && { fbc: p.fbc }),
  };
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: p.orderNumber,
        action_source: "website",
        event_source_url: p.url,
        user_data,
        custom_data: {
          currency: "EGP",
          value: p.totalPiasters / 100,
          content_type: "product",
          content_ids: [...new Set(p.lines.map((l) => l.color))],
          contents: p.lines.map((l) => ({ id: l.color, quantity: l.qty, item_price: l.linePiasters / l.qty / 100 })),
          num_items: p.lines.reduce((n, l) => n + l.qty, 0),
          order_id: p.orderNumber,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE && { test_event_code: process.env.META_TEST_EVENT_CODE }),
  };
  const res = await fetch(`https://graph.facebook.com/${version}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  // Never log the token or customer details: only the order number and Meta's status.
  if (res.ok) console.info("meta.capi.sent", { order: p.orderNumber });
  else console.error("meta.capi.failed", { order: p.orderNumber, status: res.status });
}
