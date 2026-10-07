// Drizzle table definitions used for typed queries. The source of truth for the schema is
// db/migrations/*.sql; keep these in sync (tests/db.test.ts checks the columns exist).
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  typeEn: text("type_en").notNull(),
  summaryEn: text("summary_en").notNull(),
  detailsEn: jsonb("details_en").$type<string[]>().notNull(),
  fabricEn: text("fabric_en"),
  careEn: text("care_en"),
  pricePiasters: integer("price_piasters").notNull(),
  compareAtPiasters: integer("compare_at_piasters"),
  status: text("status").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const colorways = pgTable("colorways", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  code: text("code").notNull(),
  nameEn: text("name_en").notNull(),
  swatchHex: text("swatch_hex").notNull(),
  detailEn: text("detail_en").notNull(),
  position: integer("position").notNull(),
  isActive: boolean("is_active").notNull(),
});

export const variants = pgTable("variants", {
  id: serial("id").primaryKey(),
  colorwayId: integer("colorway_id").notNull(),
  size: text("size").notNull(),
  sku: text("sku").notNull(),
  priceOverridePiasters: integer("price_override_piasters"),
  trackInventory: boolean("track_inventory").notNull(),
  stockOnHand: integer("stock_on_hand").notNull(),
  stockReserved: integer("stock_reserved").notNull(),
  isActive: boolean("is_active").notNull(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  colorwayId: integer("colorway_id").notNull(),
  src: text("src").notNull(),
  altEn: text("alt_en").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  kind: text("kind").notNull(),
  position: integer("position").notNull(),
});

export const sizeChart = pgTable("size_chart", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  size: text("size").notNull(),
  shoulderCm: integer("shoulder_cm").notNull(),
  chestCm: integer("chest_cm").notNull(),
  lengthCm: integer("length_cm").notNull(),
  weightMinKg: integer("weight_min_kg").notNull(),
  weightMaxKg: integer("weight_max_kg").notNull(),
});

export const shippingZones = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  labelEn: text("label_en").notNull(),
  feePiasters: integer("fee_piasters").notNull(),
  codAllowed: boolean("cod_allowed").notNull(),
  isActive: boolean("is_active").notNull(),
  position: integer("position").notNull(),
});

export const shippingAreas = pgTable("shipping_areas", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull(),
  slug: text("slug").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  isActive: boolean("is_active").notNull(),
});
