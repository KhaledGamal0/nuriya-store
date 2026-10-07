// Product data. This is the SEED for the database (scripts/db-seed.ts) and the fallback when no database is connected.
// The storefront reads the catalog through lib/store.ts, never from PRODUCT directly.
// Money is always integer piasters (1 EGP = 100 piasters).

export type ColorId = "cream" | "burgundy";
export type SizeId = "S/M" | "L/XL";

export const COLORS: readonly ColorId[] = ["cream", "burgundy"];
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
  pricePiasters: 120_000,
  summary:
    "A soft oversized quarter-zip with a contrast collar, a silver ring-pull zip and our signature embroidery.",
  details: [
    "Embroidered “QUIET CONFIDENCE” across the chest, with the Nuriya script above it.",
    "“do what you love, love what you do” stitched on the left sleeve, near the cuff.",
    "Pointed contrast collar, quarter-zip with silver teeth and a round ring pull, dropped shoulders, ribbed cuffs, curved hem.",
  ],
  // TODO(khaled): fabric composition, weight and care instructions.
  fabric: null as string | null,
  sizeChart: [
    { size: "S/M" as SizeId, shoulderCm: 56, chestCm: 56, lengthCm: 64, weightKg: [45, 65] as const },
    { size: "L/XL" as SizeId, shoulderCm: 60, chestCm: 60, lengthCm: 67, weightKg: [66, 80] as const },
  ],
  colors: {
    cream: {
      id: "cream",
      name: "Cream",
      swatch: "#F3F0E8",
      detail: "Cream body, burgundy collar and burgundy embroidery.",
      images: [
        { src: "/images/cream-model.jpg", alt: "A girl wearing the cream Quiet Confidence quarter-zip outdoors", width: 1290, height: 1612 },
        { src: "/images/cream-model-close.jpg", alt: "Close-up of the cream quarter-zip: burgundy collar, ring-pull zip and chest embroidery", width: 1290, height: 1612 },
        { src: "/images/cream-styled.jpg", alt: "Cream quarter-zip styled with pleated trousers and a belt", width: 1360, height: 1700 },
        { src: "/images/cream-sleeve.jpg", alt: "Sleeve embroidery: do what you love, love what you do", width: 1290, height: 1612 },
        { src: "/images/cream-model-coffee.jpg", alt: "The cream quarter-zip worn with jeans, coffee in hand", width: 1290, height: 1612 },
      ],
    },
    burgundy: {
      id: "burgundy",
      name: "Burgundy",
      swatch: "#7A2B3C",
      detail: "Burgundy body, white collar and cream embroidery.",
      images: [
        { src: "/images/burgundy-model.jpg", alt: "A girl wearing the burgundy Quiet Confidence quarter-zip with a white collar", width: 1290, height: 1612 },
        { src: "/images/burgundy-detail.jpg", alt: "Burgundy detail: white collar, ring-pull zip, chest and sleeve embroidery", width: 1290, height: 1612 },
        { src: "/images/burgundy-styled.jpg", alt: "Burgundy quarter-zip styled with a long coat and cream trousers", width: 1360, height: 1700 },
        { src: "/images/burgundy-model-trousers.jpg", alt: "The burgundy quarter-zip worn with white trousers and a brown belt", width: 1150, height: 1437 },
        { src: "/images/burgundy-sleeve.jpg", alt: "Cream sleeve embroidery on burgundy: do what you love, love what you do", width: 1264, height: 1580 },
        { src: "/images/burgundy-hanger.jpg", alt: "Burgundy quarter-zip with a white collar on a hanger", width: 1600, height: 2000 },
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
export type CatalogData = {
  slug: string;
  name: string;
  type: string;
  summary: string;
  details: readonly string[];
  fabric: string | null;
  pricePiasters: number;
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
    sizeChart: PRODUCT.sizeChart,
    colorOrder: COLORS,
    colors: { cream: colorway("cream"), burgundy: colorway("burgundy") },
  };
}

/** Price of one colour/size, or null when it cannot be sold (sold out, inactive or unknown). */
export function priceFor(catalog: CatalogData, color: ColorId, size: SizeId): number | null {
  const option = catalog.colors[color]?.sizes.find((s) => s.size === size);
  return option && option.available ? option.pricePiasters : null;
}
