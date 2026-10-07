-- Oct 7 2026 (Khaled): launch offer. Customers pay 1,000 EGP; the old 1,200 EGP shows struck through.
-- compare_at_piasters is display only (NULL = no offer). Checkout always charges price_piasters, from the server.
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_piasters integer
  CHECK (compare_at_piasters IS NULL OR compare_at_piasters > 0);
UPDATE products SET price_piasters = 100000, compare_at_piasters = 120000, updated_at = now()
WHERE slug = 'quiet-confidence';
