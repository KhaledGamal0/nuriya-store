/**
 * Areas inside Cairo and Giza, chosen from a list at checkout (Khaled, Oct 29 2026: governorate → area → address).
 * Small and data-free on purpose: the checkout form imports it. "Other" lets anyone not listed still order
 * (she writes the area in the address). The delivery fee comes from the governorate, never from the area.
 */
export const DISTRICTS: Readonly<Record<string, readonly string[]>> = {
  cairo: [
    "Abbassia", "Ain Shams", "Downtown", "El Marg", "El Obour", "El Rehab", "El Shorouk", "Garden City", "Hadayek El Kobba",
    "Heliopolis", "Helwan", "Maadi", "Madinaty", "Manial", "Mokattam", "Nasr City", "New Cairo", "Shubra", "Zamalek", "Other",
  ],
  giza: [
    "6th of October", "Agouza", "Boulaq El Dakrour", "Dokki", "Faisal", "Hadayek El Ahram", "Hadayek October", "Haram",
    "Imbaba", "Mohandessin", "Omraneya", "Sheikh Zayed", "Other",
  ],
};

/** Area check: required (from the list) for Cairo and Giza, not used elsewhere. */
export function districtError(areaId: unknown, value: unknown): string | undefined {
  const list = typeof areaId === "string" ? DISTRICTS[areaId] : undefined;
  if (!list) return undefined;
  return typeof value === "string" && list.includes(value) ? undefined : "Choose your area.";
}
