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
  cairo: "Includes 6th of October, Sheikh Zayed, Hadayek October, Madinaty, El Shorouk and El Obour.",
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
