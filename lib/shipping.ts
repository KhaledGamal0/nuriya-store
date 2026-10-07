// Delivery areas and fees from the Direction courier price list (data/shipping-zones.json).
// Phase 2 moves these into the database so the admin can edit them.
import zones from "../data/shipping-zones.json" with { type: "json" };

export type Area = { id: string; nameEn: string; nameAr: string; feePiasters: number; zoneId: string };

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const AREAS: readonly Area[] = zones.zones.flatMap((zone) =>
  zone.areas.map((area) => ({
    id: slug(area.en),
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
  "cairo-giza": "Cairo, Giza and new cities",
  "new-cities": "Cairo, Giza and new cities",
  "delta-canal": "Alexandria, Delta and Canal",
  "upper-north": "Fayoum and Beni Suef",
  upper: "Upper Egypt",
  "new-valley": "New Valley",
  "new-capital": "New Administrative Capital",
  resorts: "Red Sea, Sharm and the coast",
};

/** Areas grouped by fee, cheapest first — for the checkout picker and the delivery page. */
export function areasByFee(): { feePiasters: number; label: string; areas: Area[] }[] {
  const groups = new Map<number, Area[]>();
  for (const area of AREAS) groups.set(area.feePiasters, [...(groups.get(area.feePiasters) ?? []), area]);
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([feePiasters, areas]) => ({ feePiasters, label: GROUP_LABELS[areas[0]!.zoneId] ?? areas[0]!.nameEn, areas }));
}

export const MIN_FEE_PIASTERS = Math.min(...AREAS.map((a) => a.feePiasters));
