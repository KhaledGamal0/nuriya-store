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
