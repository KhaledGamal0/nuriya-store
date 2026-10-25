import { redeemOneTimeToken } from "@/lib/one-time-token";
import { purchaseEvent, sendServerEvents } from "@/lib/meta-capi";
import { siteUrl } from "@/lib/site";

// POST /api/meta-test {code} — sends one test PageView, ViewContent, AddToCart, InitiateCheckout and Purchase to Meta with a Test Events code, to prove the
// Conversions API token works. Shows only in Events Manager → Test events (never counted as a real order).
// Only a one-time pass written by the GitHub "Meta test" job is accepted.
export async function POST(request: Request): Promise<Response> {
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!(await redeemOneTimeToken(given))) return Response.json({ error: "Not allowed" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" && /^TEST\w{1,20}$/.test(body.code) ? body.code : null;
  if (!code) return Response.json({ error: "Test code must look like TEST12345" }, { status: 400 });
  if (!process.env.META_CAPI_TOKEN) return Response.json({ error: "META_CAPI_TOKEN is not set on the site" }, { status: 503 });
  const stamp = Date.now().toString(36);
  const visitorId = crypto.randomUUID().replace(/-/g, "").repeat(2); // 64 hex, like a real nuriya_vid
  const visitor = { ip: request.headers.get("x-real-ip"), userAgent: request.headers.get("user-agent"), visitorId };
  const url = `${siteUrl()}/quiet-confidence/white`;
  const item = { content_ids: ["cream"], contents: [{ id: "cream", quantity: 1, item_price: 900 }], value: 900 };
  const r = await sendServerEvents(
    [
      { name: "PageView", eventId: `pv-test${stamp}`, url, visitor, custom: {} },
      { name: "ViewContent", eventId: `vc-test${stamp}`, url, visitor, custom: { ...item, content_name: "White" } },
      { name: "AddToCart", eventId: `atc-test${stamp}`, url, visitor, custom: { ...item, content_name: "White · S/M" } },
      { name: "InitiateCheckout", eventId: `ic-test${stamp}`, url: `${siteUrl()}/checkout`, visitor, custom: { ...item, num_items: 1 } },
      purchaseEvent({
        orderNumber: `NUR-TEST-${stamp}`,
        totalPiasters: 97_500,
        lines: [{ color: "cream", qty: 1, linePiasters: 90_000 }],
        phone: "01000000000",
        name: "Test Order",
        ip: visitor.ip,
        userAgent: visitor.userAgent,
        visitorId,
        url: `${siteUrl()}/checkout`,
      }),
    ],
    code,
  );
  // Meta's answer has no secrets (events_received, fbtrace_id or an error message).
  return Response.json(r, { status: r.sent ? 200 : 502 });
}
