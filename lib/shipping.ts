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

/** Areas grouped by fee, cheapest first — for the checkout picker. */
export function areasByFee(): { feePiasters: number; areas: Area[] }[] {
  const groups = new Map<number, Area[]>();
  for (const area of AREAS) groups.set(area.feePiasters, [...(groups.get(area.feePiasters) ?? []), area]);
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([feePiasters, areas]) => ({ feePiasters, areas }));
}

export const MIN_FEE_PIASTERS = Math.min(...AREAS.map((a) => a.feePiasters));
