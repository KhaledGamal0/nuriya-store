// Delivery areas and fees from the Direction courier price list (data/shipping-zones.json).
// Phase 2 moves these into the database so the admin can edit them.
import zones from "../data/shipping-zones.json" with { type: "json" };

import type { Area } from "./delivery.ts";
export { AREA_NOTES, areasByFee, deliveryLine, freeDeliveryLabel, minFee, minPaidFee, type Area } from "./delivery.ts";
import { areasForPicker as pick } from "./delivery.ts";

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

/** Checkout picker groups (defaults to the built-in Direction list). */
export function areasForPicker(list: readonly Area[] = AREAS) {
  return pick(list);
}
