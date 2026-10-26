// Delivery areas and fees from the Direction courier price list (data/shipping-zones.json).
// Phase 2 moves these into the database so the admin can edit them.
import zones from "../data/shipping-zones.json" with { type: "json" };

export type Area = { id: string; nameEn: string; nameAr: string; feePiasters: number; zoneId: string };

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const AREAS: readonly Area[] = zones.zones.flatMap((zone) =>
  zone.areas.map((area: { id?: string; en: string; ar: string }) => ({
    id: area.id ?? slug(area.en),
    nameEn: area.en,
    nameAr: area.ar,
    feePiasters: zone.fee * 100,
    zoneId: zone.id,
  })),
);

export function getArea(id: unknown): Area | undefined {
  return typeof id === "string" ? AREAS.find((a) => a.id === id) : undefined;
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

/** Which places one checkout option covers, shown under the area picker and on the delivery page. */
export const AREA_NOTES: Record<string, string> = {
  cairo: "Includes October, Sheikh Zayed, Madinaty, El Shorouk and El Obour.",
};

/** Checkout picker: one group per region with its fee in the heading (cheapest first), places A to Z inside. */
export function areasForPicker(list: readonly Area[] = AREAS): { label: string; feePiasters: number; areas: Area[] }[] {
  return areasByFee(list).map((g) => ({ ...g, areas: [...g.areas].sort((a, b) => a.nameEn.localeCompare(b.nameEn)) }));
}

/** Areas grouped by fee, cheapest first — for the checkout picker and the delivery page. */
export function areasByFee(list: readonly Area[] = AREAS): { feePiasters: number; label: string; areas: Area[] }[] {
  const groups = new Map<number, Area[]>();
  for (const area of list) groups.set(area.feePiasters, [...(groups.get(area.feePiasters) ?? []), area]);
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([feePiasters, areas]) => ({ feePiasters, label: GROUP_LABELS[areas[0]!.zoneId] ?? areas[0]!.nameEn, areas }));
}

export function minFee(list: readonly Area[] = AREAS): number {
  return list.length ? Math.min(...list.map((a) => a.feePiasters)) : 0;
}

/** The lowest fee that isn't free (e.g. 90 EGP while Cairo & Giza is free). */
export function minPaidFee(list: readonly Area[] = AREAS): number {
  const paid = list.map((a) => a.feePiasters).filter((f) => f > 0);
  return paid.length ? Math.min(...paid) : 0;
}

/**
 * Where delivery is free right now ("Cairo & Giza"), or null. Read from the fees themselves (the database), so
 * free delivery shows or hides everywhere on its own when the fee changes (admin task set-delivery-fee).
 */
export function freeDeliveryLabel(list: readonly Area[] = AREAS): string | null {
  return areasByFee(list).find((g) => g.feePiasters === 0)?.label ?? null;
}

/** One short line about delivery: "Free delivery in Cairo & Giza. Other areas from 90 EGP" / "Delivery from 75 EGP". */
export function deliveryLine(list: readonly Area[] = AREAS): string {
  const free = freeDeliveryLabel(list);
  const from = (free ? minPaidFee(list) : minFee(list)) / 100;
  const egp = `${from.toLocaleString("en-US")} EGP`;
  if (!free) return `Delivery from ${egp}`;
  return from ? `Free delivery in ${free}. Other areas from ${egp}` : `Free delivery in ${free}`;
}
