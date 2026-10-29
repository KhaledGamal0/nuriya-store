// Delivery helpers with NO price-list data in them, so phone pages that only need "is delivery free?" stay small
// (lib/shipping.ts imports the whole Direction list; client components import this file instead).
export type Area = {
  id: string; nameEn: string; nameAr: string; feePiasters: number; zoneId: string;
  /** A promotional fee (e.g. free delivery) that ends at this moment (ISO); after it the fee is afterPromoPiasters. */
  promoUntil?: string; afterPromoPiasters?: number;
};

/**
 * Areas as they are at `now`: a promo that has ended takes its normal fee (Khaled, Oct 29 2026: free delivery in
 * Cairo & Giza ends Sat 31 Oct 23:59 Cairo). The bag and checkout switch on that second without a reload; the
 * server applies the same rule from the database at checkout.
 */
export function areasAt(list: readonly Area[], now: number = Date.now()): Area[] {
  return list.map((a) =>
    a.promoUntil && a.afterPromoPiasters != null && Date.parse(a.promoUntil) <= now
      ? { ...a, feePiasters: a.afterPromoPiasters, promoUntil: undefined, afterPromoPiasters: undefined }
      : a,
  );
}

/** The earliest moment a delivery promo ends (ms), or null. */
export function nextPromoEnd(list: readonly Area[], now: number = Date.now()): number | null {
  const ends = list.map((a) => (a.promoUntil ? Date.parse(a.promoUntil) : NaN)).filter((t) => t > now);
  return ends.length ? Math.min(...ends) : null;
}

const GROUP_LABELS: Record<string, string> = {
  "cairo-giza": "Cairo & Giza",
  "new-cities": "Cairo & Giza",
  "delta-canal": "Alexandria, Delta and Canal",
  "upper-north": "Fayoum and Beni Suef",
  upper: "Upper Egypt",
  "new-valley": "New Valley",
  "new-capital": "New Administrative Capital",
  resorts: "Red Sea, Sharm and the coast",
};

/** Areas grouped by fee, cheapest first — for the checkout picker and the delivery page. */
export function areasByFee(list: readonly Area[]): { feePiasters: number; label: string; areas: Area[] }[] {
  const groups = new Map<number, Area[]>();
  for (const area of list) groups.set(area.feePiasters, [...(groups.get(area.feePiasters) ?? []), area]);
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([feePiasters, areas]) => ({ feePiasters, label: GROUP_LABELS[areas[0]!.zoneId] ?? areas[0]!.nameEn, areas }));
}

export function minFee(list: readonly Area[]): number {
  return list.length ? Math.min(...list.map((a) => a.feePiasters)) : 0;
}

/** The lowest fee that isn't free (e.g. 90 EGP while Cairo & Giza is free). */
export function minPaidFee(list: readonly Area[]): number {
  const paid = list.map((a) => a.feePiasters).filter((f) => f > 0);
  return paid.length ? Math.min(...paid) : 0;
}

/**
 * Where delivery is free right now ("Cairo & Giza"), or null. Read from the fees themselves (the database), so
 * free delivery shows or hides everywhere on its own when the fee changes (admin task set-delivery-fee).
 */
export function freeDeliveryLabel(list: readonly Area[]): string | null {
  return areasByFee(list).find((g) => g.feePiasters === 0)?.label ?? null;
}

/** One short line about delivery: "Free delivery in Cairo & Giza. Other areas from 90 EGP" / "Delivery from 75 EGP". */
export function deliveryLine(list: readonly Area[]): string {
  const free = freeDeliveryLabel(list);
  const from = (free ? minPaidFee(list) : minFee(list)) / 100;
  const egp = `${from.toLocaleString("en-US")} EGP`;
  if (!free) return `Delivery from ${egp}`;
  return from ? `Free delivery in ${free}. Other areas from ${egp}` : `Free delivery in ${free}`;
}

/** Which places one checkout option covers, shown under the area picker and on the delivery page. */
export const AREA_NOTES: Record<string, string> = {}; // Oct 29 2026: the area inside Cairo / Giza is a list (lib/districts.ts).

/** Checkout picker: one group per region with its fee in the heading (cheapest first), places A to Z inside. */
export function areasForPicker(list: readonly Area[]): { label: string; feePiasters: number; areas: Area[] }[] {
  return areasByFee(list).map((g) => ({ ...g, areas: [...g.areas].sort((a, b) => a.nameEn.localeCompare(b.nameEn)) }));
}

