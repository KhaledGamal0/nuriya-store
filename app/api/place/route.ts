export const dynamic = "force-dynamic";

const clean = (v: string | null) => {
  if (!v) return "";
  try {
    return decodeURIComponent(v).slice(0, 60);
  } catch {
    return v.slice(0, 60);
  }
};

/**
 * Approximate place of the visitor (city and region), from Vercel's network location of the request.
 * Nothing is stored here; the browser sends it once per visit to the visitor stats. No IP is returned.
 */
export async function GET(req: Request): Promise<Response> {
  const h = req.headers;
  return Response.json(
    { city: clean(h.get("x-vercel-ip-city")), region: clean(h.get("x-vercel-ip-country-region")), country: clean(h.get("x-vercel-ip-country")) },
    { headers: { "cache-control": "no-store" } },
  );
}
