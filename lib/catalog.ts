// Product catalog. Phase 2 moves this into the database and the admin; the shape stays the same.
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
        { src: "/images/cream-styled.jpg", alt: "Cream Quiet Confidence quarter-zip styled with pleated trousers and a belt", width: 1360, height: 1700 },
        { src: "/images/cream-on-model.jpg", alt: "A girl wearing the cream quarter-zip with wide-leg jeans", width: 900, height: 1600 },
        { src: "/images/cream-chest.jpg", alt: "Close-up of the chest embroidery and burgundy collar", width: 740, height: 925 },
        { src: "/images/sleeve.jpg", alt: "Sleeve embroidery: do what you love, love what you do", width: 900, height: 1600 },
      ],
    },
    burgundy: {
      id: "burgundy",
      name: "Burgundy",
      swatch: "#7A2B3C",
      detail: "Burgundy body, white collar and cream embroidery.",
      images: [
        { src: "/images/burgundy-styled.jpg", alt: "Burgundy Quiet Confidence quarter-zip styled with a long coat and cream trousers", width: 1360, height: 1700 },
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
