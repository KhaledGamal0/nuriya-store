// Product data. This is the SEED for the database (scripts/db-seed.ts) and the fallback when no database is connected.
// The storefront reads the catalog through lib/store.ts, never from PRODUCT directly.
// Money is always integer piasters (1 EGP = 100 piasters).

export type ColorId = "cream" | "burgundy";
export type SizeId = "S/M" | "L/XL";

export const COLORS: readonly ColorId[] = ["cream", "burgundy"];

/** Customer-facing address of each colour. The internal id "cream" stays (stock, SKUs, saved bags);
 * customers see and link to "white" (Khaled, Oct 7 2026). /quiet-confidence/cream redirects. */
export const COLOR_SLUG: Record<ColorId, string> = { cream: "white", burgundy: "burgundy" };
export const productPath = (c: ColorId) => `/quiet-confidence/${COLOR_SLUG[c]}`;
export function colorFromSlug(slug: string): ColorId | null {
  return COLORS.find((c) => COLOR_SLUG[c] === slug) ?? null;
}
export const SIZES: readonly SizeId[] = ["S/M", "L/XL"];

export type ProductImage = { src: string; alt: string; width: number; height: number };

export type Colorway = {
  id: ColorId;
  name: string;
  swatch: string;
  detail: string;
  images: readonly ProductImage[];
};

export const PRODUCT = {
  slug: "quiet-confidence",
  name: "Quiet Confidence",
  type: "Quarter-zip",
  pricePiasters: 100_000,
  /** Launch offer (Khaled, Oct 7 2026): the old price, shown struck through. null = no offer. */
  compareAtPiasters: 120_000 as number | null,
  summary:
    "A soft oversized quarter-zip with a contrast collar, a silver ring-pull zip and our signature embroidery.",
  details: [
    "Embroidered “QUIET CONFIDENCE” across the chest, with the Nuriya script above it.",
    "“do what you love, love what you do” stitched on the left sleeve, near the cuff.",
    "Pointed contrast collar, quarter-zip with silver teeth and a round ring pull, dropped shoulders, ribbed cuffs, curved hem.",
  ],
  /** The model in the photos, both colours (Khaled, Oct 11 2026). Shown next to the size buttons. */
  model: { heightCm: 160, weightKg: 50, wears: "S/M" as SizeId },
  // TODO(khaled): fabric composition, weight and care instructions.
  fabric: null as string | null,
  sizeChart: [
    { size: "S/M" as SizeId, shoulderCm: 56, chestCm: 112, lengthCm: 64, weightKg: [45, 65] as const },
    { size: "L/XL" as SizeId, shoulderCm: 60, chestCm: 120, lengthCm: 67, weightKg: [66, 80] as const },
  ],
  colors: {
    cream: {
      id: "cream",
      name: "White",
      swatch: "#FFFFFF",
      detail: "White body, burgundy collar and burgundy embroidery.",
      images: [
        { src: "/images/cream-hd-model.jpg", alt: "Smiling girl in the white Quiet Confidence quarter-zip with a burgundy collar, wide-leg jeans and an iced coffee", width: 1500, height: 1875 },
        { src: "/images/cream-hd-chest.jpg", alt: "Close-up of the white quarter-zip: burgundy collar, ring-pull zip and burgundy QUIET CONFIDENCE embroidery", width: 1170, height: 1462 },
        { src: "/images/cream-hd-sleeve.jpg", alt: "White cuff embroidered in burgundy: do what you love, love what you do", width: 1170, height: 1462 },
      ],
    },
    burgundy: {
      id: "burgundy",
      name: "Burgundy",
      swatch: "#7A2B3C",
      detail: "Burgundy body, white collar and white embroidery.",
      images: [
        { src: "/images/burgundy-hd-collar.jpg", alt: "Burgundy quarter-zip worn with jeans, hand at the white collar", width: 1300, height: 1625 },
        { src: "/images/burgundy-hd-flatlay.jpg", alt: "Burgundy quarter-zip laid flat: white collar, Nuriya label, ring-pull zip and white embroidery on the chest and sleeve", width: 1590, height: 1987 },
        { src: "/images/burgundy-hd-full.jpg", alt: "Full-length look: burgundy quarter-zip, wide-leg jeans and white trainers", width: 1480, height: 1850 },
      ],
    },
  } satisfies Record<ColorId, Colorway>,
} as const;

export function isColor(value: unknown): value is ColorId {
  return typeof value === "string" && (COLORS as readonly string[]).includes(value);
}

export function isSize(value: unknown): value is SizeId {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

/** Recommended size for a body weight, from the brand size guide. */
export function sizeForWeight(kg: number): { size: SizeId; note: string } {
  if (kg <= 65) return { size: "S/M", note: "Relaxed and oversized, as designed." };
  if (kg <= 80) return { size: "L/XL", note: "Relaxed and oversized, as designed." };
  return { size: "L/XL", note: "It may fit closer than oversized. Message us on Instagram and we will help." };
}

// ---------- Catalog as the storefront sees it (from the database, or from PRODUCT above as fallback) ----------

export type SizeOption = { size: SizeId; available: boolean; pricePiasters: number };
export type ColorwayData = Colorway & { sizes: readonly SizeOption[] };
export type SizeChartRow = { size: SizeId; shoulderCm: number; chestCm: number; lengthCm: number; weightKg: readonly [number, number] };
/** When the sale ends, and the prices that apply from that moment (so pages switch on time without a reload). */
export type SaleInfo = { endsAt: string; after: { pricePiasters: number; compareAtPiasters: number | null } };

export type CatalogData = {
  slug: string;
  name: string;
  type: string;
  summary: string;
  details: readonly string[];
  fabric: string | null;
  pricePiasters: number;
  /** Old price shown struck through during an offer (display only; checkout charges pricePiasters). */
  compareAtPiasters: number | null;
  /** A timed sale running right now (prices above are already the sale prices), or null. */
  sale: SaleInfo | null;
  /**
   * Launch offer counted in pieces: how many pieces are still left at the offer price (pricePiasters) for
   * everyone; after that each piece costs compareAtPiasters. null = no piece limit. Display only: the
   * server recounts inside the order transaction.
   */
  offerPiecesLeft?: number | null;
  sizeChart: readonly SizeChartRow[];
  colorOrder: readonly ColorId[];
  colors: Record<ColorId, ColorwayData>;
};

/** The built-in product data, every size available. Used until the database is connected, and by tests. */
export function staticCatalog(): CatalogData {
  const colorway = (id: ColorId): ColorwayData => ({
    ...PRODUCT.colors[id],
    sizes: SIZES.map((size) => ({ size, available: true, pricePiasters: PRODUCT.pricePiasters })),
  });
  return {
    slug: PRODUCT.slug,
    name: PRODUCT.name,
    type: PRODUCT.type,
    summary: PRODUCT.summary,
    details: PRODUCT.details,
    fabric: PRODUCT.fabric,
    pricePiasters: PRODUCT.pricePiasters,
    compareAtPiasters: PRODUCT.compareAtPiasters,
    sale: null,
    offerPiecesLeft: null,
    sizeChart: PRODUCT.sizeChart,
    colorOrder: COLORS,
    colors: { cream: colorway("cream"), burgundy: colorway("burgundy") },
  };
}

/** The catalog as it is once the sale has ended (display only; the server always prices from the database). */
export function afterSale(c: CatalogData): CatalogData {
  if (!c.sale) return c;
  const { pricePiasters, compareAtPiasters } = c.sale.after;
  const colors = { ...c.colors };
  for (const id of c.colorOrder)
    colors[id] = { ...colors[id], sizes: colors[id].sizes.map((s) => ({ ...s, pricePiasters: s.pricePiasters === c.pricePiasters ? pricePiasters : s.pricePiasters })) };
  return { ...c, pricePiasters, compareAtPiasters, sale: null, colors };
}

/** Whole-percent saving, e.g. 120000 → 90000 is 25. */
export const percentOff = (now: number, was: number | null) => (was && was > now ? Math.round((1 - now / was) * 100) : 0);

/** Price of one colour/size, or null when it cannot be sold (sold out, inactive or unknown). */
export function priceFor(catalog: CatalogData, color: ColorId, size: SizeId): number | null {
  const option = catalog.colors[color]?.sizes.find((s) => s.size === size);
  return option && option.available ? option.pricePiasters : null;
}

export type PricedPiece = { color: ColorId; size: SizeId; qty: number; unitPiasters: number };

/**
 * Prices a bag, splitting a line when the launch offer runs out inside it: the first pieces (in bag order) take
 * the offer price while offer pieces are left, the rest pay the full price. Example with 2 left and 3 in the bag:
 * 2 × 1,000 + 1 × 1,200. During a timed sale there is no split (sale pieces don't use up the offer).
 * Returns null if any line can't be sold. The same rule runs again in the database at checkout (lib/orders.ts).
 */
export function priceBag(catalog: CatalogData, lines: readonly { color: ColorId; size: SizeId; qty: number }[]): PricedPiece[] | null {
  const full = catalog.compareAtPiasters;
  const limited = !catalog.sale && full != null && catalog.offerPiecesLeft != null;
  let left = limited ? Math.max(0, catalog.offerPiecesLeft!) : Infinity;
  const out: PricedPiece[] = [];
  for (const l of lines) {
    const unit = priceFor(catalog, l.color, l.size);
    if (unit === null) return null;
    if (!limited || unit !== catalog.pricePiasters) {
      out.push({ ...l, unitPiasters: unit });
      continue;
    }
    const atOffer = Math.min(left, l.qty);
    if (atOffer > 0) out.push({ color: l.color, size: l.size, qty: atOffer, unitPiasters: unit });
    if (l.qty - atOffer > 0) out.push({ color: l.color, size: l.size, qty: l.qty - atOffer, unitPiasters: full! });
    left -= atOffer;
  }
  return out;
}
