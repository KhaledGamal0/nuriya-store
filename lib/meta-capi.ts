import { createHash } from "node:crypto";
import { META_PIXEL_ID } from "./pixel.ts";

/**
 * Meta Conversions API: shop events are also sent from the server, so visits from phones that block the
 * browser Pixel (iPhone privacy, ad blockers, in-app browsers) still reach Meta. Each server event carries the
 * SAME event_id as its browser twin, so Meta keeps one copy.
 *   - Purchase: sent by the checkout action after the order is saved (order number = event_id).
 *   - ViewContent / AddToCart / InitiateCheckout: the browser posts a small background note to /api/meta-event.
 * Everything runs after the visitor already has her page or answer; failures are logged and ignored.
 * Needs META_CAPI_TOKEN (Vercel env, server only, Production). Without it nothing is sent.
 * Customer details are SHA-256 hashed here before they leave the server, as Meta requires.
 */
const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/** "01012345678" → "201012345678" (Meta wants country code, digits only). */
export function metaPhone(local: string): string | null {
  const d = local.replace(/\D/g, "");
  return /^01\d{9}$/.test(d) ? `2${d}` : null;
}

/**
 * Delivery area → Meta's state (governorate) and city, lowercase letters only, as Meta normalises them.
 * "Cairo & Giza" → cairo / cairo · "Alexandria" → alexandria / alexandria · "Giza countryside" → giza (state only).
 */
export function metaPlace(area: string): { st?: string; ct?: string } {
  const a = area.toLowerCase();
  if (a.startsWith("cairo")) return { st: "cairo", ct: "cairo" };
  if (a.includes("countryside")) return { st: a.replace("countryside", "").replace(/[^a-z]/g, "") || undefined };
  const st = a.replace(/[^a-z]/g, "");
  return st ? { st, ct: st } : {};
}

/** "Sara Ahmed Ali" → first "sara", last "ali" (Arabic names kept as written). */
export function metaName(full: string): { fn?: string; ln?: string } {
  const parts = full.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  return { fn: parts[0], ln: parts.length > 1 ? parts[parts.length - 1] : undefined };
}

export type Visitor = {
  ip: string | null;
  userAgent: string | null;
  fbp?: string;
  fbc?: string;
  /** Only known on a real order. */
  phone?: string;
  name?: string;
  area?: string;
  /** A returning buyer's id: the SHA-256 of her phone (already hashed in her browser at her last order). */
  externalId?: string;
};

export type ServerEvent = {
  name: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
  eventId: string;
  url: string;
  visitor: Visitor;
  custom: Record<string, unknown>;
};

export type SendResult = { sent: boolean; status: number; meta?: unknown };

function userData(v: Visitor): Record<string, unknown> {
  const ph = v.phone ? metaPhone(v.phone) : null;
  const { fn, ln } = v.name ? metaName(v.name) : {};
  const { st, ct } = v.area ? metaPlace(v.area) : {};
  const xid = ph ? sha(ph) : v.externalId && /^[0-9a-f]{64}$/.test(v.externalId) ? v.externalId : null;
  return {
    country: [sha("eg")],
    ...(ph && { ph: [sha(ph)] }),
    ...(xid && { external_id: [xid] }),
    ...(st && { st: [sha(st)] }),
    ...(ct && { ct: [sha(ct)] }),
    ...(fn && { fn: [sha(fn)] }),
    ...(ln && { ln: [sha(ln)] }),
    ...(v.ip && { client_ip_address: v.ip }),
    ...(v.userAgent && { client_user_agent: v.userAgent }),
    ...(v.fbp && { fbp: v.fbp }),
    ...(v.fbc && { fbc: v.fbc }),
  };
}

/** testCode: only for the on-demand test (Events Manager → Test events); real traffic never passes one. */
export async function sendServerEvents(events: ServerEvent[], testCode?: string): Promise<SendResult> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token || !events.length) return { sent: false, status: 0 };
  const version = process.env.META_GRAPH_VERSION || "v24.0";
  const now = Math.floor(Date.now() / 1000);
  const body = {
    data: events.map((e) => ({
      event_name: e.name,
      event_time: now,
      event_id: e.eventId,
      action_source: "website",
      event_source_url: e.url,
      user_data: userData(e.visitor),
      custom_data: { currency: "EGP", content_type: "product", ...e.custom },
    })),
    ...(testCode && { test_event_code: testCode }),
  };
  const res = await fetch(`https://graph.facebook.com/${version}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  // Never log the token or customer details: only event names, ids and Meta's status.
  const ids = events.map((e) => `${e.name}:${e.eventId}`);
  if (res.ok) console.info("meta.capi.sent", ids);
  else console.error("meta.capi.failed", { ids, status: res.status });
  const meta = await res.json().catch(() => undefined);
  return { sent: res.ok, status: res.status, meta };
}

export type ServerPurchase = {
  orderNumber: string;
  totalPiasters: number;
  lines: { color: string; qty: number; linePiasters: number }[];
  phone: string;
  name: string;
  area?: string;
  ip: string | null;
  userAgent: string | null;
  fbp?: string;
  fbc?: string;
  url: string;
};

export function purchaseEvent(p: ServerPurchase): ServerEvent {
  return {
    name: "Purchase",
    eventId: p.orderNumber,
    url: p.url,
    visitor: { ip: p.ip, userAgent: p.userAgent, fbp: p.fbp, fbc: p.fbc, phone: p.phone, name: p.name, area: p.area },
    custom: {
      value: p.totalPiasters / 100,
      content_ids: [...new Set(p.lines.map((l) => l.color))],
      contents: p.lines.map((l) => ({ id: l.color, quantity: l.qty, item_price: l.linePiasters / l.qty / 100 })),
      num_items: p.lines.reduce((n, l) => n + l.qty, 0),
      order_id: p.orderNumber,
    },
  };
}

export function sendServerPurchase(p: ServerPurchase, testCode?: string): Promise<SendResult> {
  return sendServerEvents([purchaseEvent(p)], testCode);
}

// ---------- Browser notes for ViewContent / AddToCart / InitiateCheckout ----------

const CLIENT_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout"]);
const COLORS = new Set(["cream", "burgundy"]);

/**
 * Checks a note posted by the browser and keeps only safe, expected fields (anything else is dropped).
 * Returns null for anything that doesn't look like one of our own events.
 */
export function parseClientEvent(raw: unknown): { name: ServerEvent["name"]; eventId: string; path: string; custom: Record<string, unknown>; externalId?: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = r.name;
  const eventId = r.eventId;
  const path = r.path;
  const c = (r.custom && typeof r.custom === "object" ? r.custom : {}) as Record<string, unknown>;
  if (typeof name !== "string" || !CLIENT_EVENTS.has(name)) return null;
  if (typeof eventId !== "string" || !/^[a-z]{2,4}-[A-Za-z0-9-]{6,40}$/.test(eventId)) return null;
  if (typeof path !== "string" || !/^\/[\w\-/]{0,80}$/.test(path)) return null;
  const ids = Array.isArray(c.content_ids) ? c.content_ids.filter((x): x is string => typeof x === "string" && COLORS.has(x)).slice(0, 4) : [];
  const value = typeof c.value === "number" && Number.isFinite(c.value) && c.value >= 0 && c.value <= 50_000 ? Math.round(c.value * 100) / 100 : undefined;
  const num = typeof c.num_items === "number" && Number.isInteger(c.num_items) && c.num_items > 0 && c.num_items <= 50 ? c.num_items : undefined;
  const contents = Array.isArray(c.contents)
    ? c.contents
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && COLORS.has(String((x as Record<string, unknown>).id)))
        .slice(0, 8)
        .map((x) => ({
          id: String(x.id),
          quantity: Number.isInteger(x.quantity) && (x.quantity as number) > 0 && (x.quantity as number) <= 50 ? x.quantity : 1,
          ...(typeof x.item_price === "number" && x.item_price >= 0 && x.item_price <= 50_000 && { item_price: x.item_price }),
        }))
    : [];
  const contentName = typeof c.content_name === "string" ? c.content_name.slice(0, 60) : undefined;
  const xid = typeof r.xid === "string" && /^[0-9a-f]{64}$/.test(r.xid) ? r.xid : undefined;
  return {
    name: name as ServerEvent["name"],
    eventId,
    path,
    ...(xid && { externalId: xid }),
    custom: {
      ...(ids.length && { content_ids: ids }),
      ...(contents.length && { contents }),
      ...(value !== undefined && { value }),
      ...(num && { num_items: num }),
      ...(contentName && { content_name: contentName }),
    },
  };
}
