// Seeds the catalog, delivery zones and content from the project data. Safe to re-run:
// existing rows are left untouched (ON CONFLICT DO NOTHING), so admin edits are never overwritten.
// Usage: DATABASE_URL=... node --experimental-strip-types scripts/db-seed.ts
import postgres from "postgres";
import { PRODUCT, COLORS, SIZES } from "../lib/catalog.ts";
import zones from "../data/shipping-zones.json" with { type: "json" };

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { max: 1, onnotice: () => {} });

const ZONE_LABELS: Record<string, string> = {
  "cairo-giza": "Cairo and Giza",
  "new-cities": "New cities",
  "delta-canal": "Alexandria, Delta and Canal",
  "upper-north": "Fayoum and Beni Suef",
  upper: "Upper Egypt",
  "new-valley": "New Valley",
  "new-capital": "New Administrative Capital",
  resorts: "Red Sea, Sharm and the coast",
};
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const kindOf = (src: string) =>
  src.includes("styled") ? "styled" : src.includes("model") ? "model" : src.includes("hanger") ? "flat" : "detail";
const SKU_COLOR: Record<string, string> = { cream: "CRM", burgundy: "BRG" };

try {
  await sql.begin(async (tx) => {
    const [p] = await tx`
      INSERT INTO products (slug, name_en, type_en, summary_en, details_en, fabric_en, price_piasters)
      VALUES (${PRODUCT.slug}, ${PRODUCT.name}, ${PRODUCT.type}, ${PRODUCT.summary},
              ${tx.json([...PRODUCT.details])}, ${PRODUCT.fabric}, ${PRODUCT.pricePiasters})
      ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
      RETURNING id`;
    const productId = p!.id;

    for (const row of PRODUCT.sizeChart) {
      await tx`
        INSERT INTO size_chart (product_id, size, shoulder_cm, chest_cm, length_cm, weight_min_kg, weight_max_kg)
        VALUES (${productId}, ${row.size}, ${row.shoulderCm}, ${row.chestCm}, ${row.lengthCm}, ${row.weightKg[0]}, ${row.weightKg[1]})
        ON CONFLICT (product_id, size) DO NOTHING`;
    }

    for (const [i, code] of COLORS.entries()) {
      const c = PRODUCT.colors[code];
      const [cw] = await tx`
        INSERT INTO colorways (product_id, code, name_en, swatch_hex, detail_en, position)
        VALUES (${productId}, ${code}, ${c.name}, ${c.swatch}, ${c.detail}, ${i})
        ON CONFLICT (product_id, code) DO UPDATE SET code = EXCLUDED.code
        RETURNING id`;
      const colorwayId = cw!.id;
      const hasMedia = await tx`SELECT 1 FROM media WHERE colorway_id = ${colorwayId} LIMIT 1`;
      if (hasMedia.length === 0) {
        for (const [pos, img] of c.images.entries()) {
          await tx`
            INSERT INTO media (colorway_id, src, alt_en, width, height, kind, position)
            VALUES (${colorwayId}, ${img.src}, ${img.alt}, ${img.width}, ${img.height}, ${kindOf(img.src)}, ${pos})`;
        }
      }
      for (const size of SIZES) {
        await tx`
          INSERT INTO variants (colorway_id, size, sku)
          VALUES (${colorwayId}, ${size}, ${`NUR-QC-${SKU_COLOR[code]}-${size.replace("/", "")}`})
          ON CONFLICT (colorway_id, size) DO NOTHING`;
      }
    }

    for (const [i, z] of zones.zones.entries()) {
      const [zone] = await tx`
        INSERT INTO shipping_zones (code, label_en, fee_piasters, position)
        VALUES (${z.id}, ${ZONE_LABELS[z.id] ?? z.id}, ${z.fee * 100}, ${i})
        ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code
        RETURNING id`;
      for (const a of z.areas) {
        await tx`
          INSERT INTO shipping_areas (zone_id, slug, name_en, name_ar)
          VALUES (${zone!.id}, ${slug(a.en)}, ${a.en}, ${a.ar})
          ON CONFLICT (slug) DO NOTHING`;
      }
    }

    const content: [string, string, string][] = [
      ["hero.title", "Not loud. Just unforgettable.", ""],
      ["policy.before", "Open your parcel and check the size and the item while the courier is still with you.", "يمكنك فتح الطلب والتأكد من المقاس والمنتج أثناء وجود مندوب الشحن معك."],
      ["policy.after", "Once the order is accepted and the courier has left, returns and exchanges are closed.", "بعد قبول الطلب ومغادرة المندوب، لا يمكننا قبول الاسترجاع أو الاستبدال."],
      ["policy.note", "Please check your size and item before accepting.", "نرجو التأكد من المقاس والمنتج قبل استلام الطلب."],
    ];
    for (const [key, en, ar] of content) {
      await tx`INSERT INTO content_blocks (key, value_en, value_ar) VALUES (${key}, ${en}, ${ar}) ON CONFLICT (key) DO NOTHING`;
    }
  });
  const [counts] = await sql`
    SELECT (SELECT count(*) FROM variants)::int AS variants, (SELECT count(*) FROM media)::int AS media,
           (SELECT count(*) FROM shipping_areas)::int AS areas`;
  console.log("seed complete", counts);
} finally {
  await sql.end();
}
