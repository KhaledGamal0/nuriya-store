// The storefront's single way to read the catalog and delivery areas.
// From the database when DATABASE_URL is set; otherwise the built-in data (until Neon is connected).
import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, hasDatabase } from "./db/index.ts";
import { colorways, media, products, shippingAreas, shippingZones, sizeChart, variants } from "./db/schema.ts";
import {
  COLORS,
  SIZES,
  isColor,
  isSize,
  staticCatalog,
  type CatalogData,
  type ColorId,
  type ColorwayData,
  type SizeChartRow,
} from "./catalog.ts";
import { AREAS, type Area } from "./shipping.ts";

const PRODUCT_SLUG = "quiet-confidence";

async function loadCatalog(): Promise<CatalogData> {
  const db = getDb();
  const [product] = await db.select().from(products).where(and(eq(products.slug, PRODUCT_SLUG), eq(products.status, "live")));
  if (!product) throw new Error(`Product ${PRODUCT_SLUG} is not live in the database`);

  const cws = await db
    .select()
    .from(colorways)
    .where(and(eq(colorways.productId, product.id), eq(colorways.isActive, true)))
    .orderBy(asc(colorways.position));
  const ids = cws.map((c) => c.id);
  const [vars, pics, chart] = await Promise.all([
    ids.length ? db.select().from(variants).where(inArray(variants.colorwayId, ids)) : Promise.resolve([]),
    ids.length ? db.select().from(media).where(inArray(media.colorwayId, ids)).orderBy(asc(media.position)) : Promise.resolve([]),
    db.select().from(sizeChart).where(eq(sizeChart.productId, product.id)),
  ]);

  const colors = {} as Record<ColorId, ColorwayData>;
  const order: ColorId[] = [];
  for (const cw of cws) {
    if (!isColor(cw.code)) continue;
    order.push(cw.code);
    colors[cw.code] = {
      id: cw.code,
      name: cw.nameEn,
      swatch: cw.swatchHex,
      detail: cw.detailEn,
      images: pics.filter((m) => m.colorwayId === cw.id).map((m) => ({ src: m.src, alt: m.altEn, width: m.width, height: m.height })),
      sizes: SIZES.map((size) => {
        const v = vars.find((x) => x.colorwayId === cw.id && x.size === size);
        const inStock = v ? !v.trackInventory || v.stockOnHand - v.stockReserved > 0 : false;
        return { size, available: Boolean(v?.isActive) && inStock, pricePiasters: v?.priceOverridePiasters ?? product.pricePiasters };
      }),
    };
  }
  // The storefront expects both colours; fall back to built-in data for any colour missing from the database.
  const fallback = staticCatalog();
  for (const c of COLORS) if (!colors[c]) colors[c] = { ...fallback.colors[c], sizes: fallback.colors[c].sizes.map((s) => ({ ...s, available: false })) };

  const sizeRows: SizeChartRow[] = chart
    .filter((r) => isSize(r.size))
    .map((r) => ({ size: r.size as SizeChartRow["size"], shoulderCm: r.shoulderCm, chestCm: r.chestCm, lengthCm: r.lengthCm, weightKg: [r.weightMinKg, r.weightMaxKg] as const }))
    .sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));

  return {
    slug: product.slug,
    name: product.nameEn,
    type: product.typeEn,
    summary: product.summaryEn,
    details: product.detailsEn,
    fabric: product.fabricEn,
    pricePiasters: product.pricePiasters,
    sizeChart: sizeRows.length ? sizeRows : fallback.sizeChart,
    colorOrder: order.length ? order : COLORS,
    colors,
  };
}

async function loadAreas(): Promise<Area[]> {
  const rows = await getDb()
    .select({
      slug: shippingAreas.slug,
      nameEn: shippingAreas.nameEn,
      nameAr: shippingAreas.nameAr,
      fee: shippingZones.feePiasters,
      zone: shippingZones.code,
      position: shippingZones.position,
    })
    .from(shippingAreas)
    .innerJoin(shippingZones, eq(shippingAreas.zoneId, shippingZones.id))
    .where(and(eq(shippingAreas.isActive, true), eq(shippingZones.isActive, true)))
    .orderBy(asc(shippingZones.position), asc(shippingAreas.id));
  return rows.map((r) => ({ id: r.slug, nameEn: r.nameEn, nameAr: r.nameAr, feePiasters: r.fee, zoneId: r.zone }));
}

/** Catalog for this request (deduplicated across components). */
export const getCatalog = cache(async (): Promise<CatalogData> => (hasDatabase() ? loadCatalog() : staticCatalog()));

/** Active delivery areas with their fees. */
export const getAreas = cache(async (): Promise<Area[]> => (hasDatabase() ? loadAreas() : [...AREAS]));
