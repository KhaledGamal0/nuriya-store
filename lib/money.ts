/** A delivery fee for people: 0 → "Free" (free delivery, e.g. Cairo & Giza since Oct 26 2026), else "75 EGP". */
export function formatFee(piasters: number): string {
  return piasters === 0 ? "Free" : formatEgp(piasters);
}

/** Format integer piasters as Egyptian pounds, e.g. 120000 -> "1,200 EGP". */
export function formatEgp(piasters: number): string {
  const egp = piasters / 100;
  const text = Number.isInteger(egp)
    ? egp.toLocaleString("en-US")
    : egp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${text} EGP`;
}
