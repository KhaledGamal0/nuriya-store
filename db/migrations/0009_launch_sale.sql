-- Oct 8 2026 (Khaled): launch-day sale. 900 EGP (25% off 1,200) for everyone, from now until
-- Saturday 10 Oct 00:00 Cairo time (= Fri 9 Oct 21:00 UTC). Then the price is exactly as before
-- (1,000 EGP launch offer for 7 more orders, then 1,200). Sale orders don't count toward those 7.
-- Checkout charges the sale price only inside the window, decided by the database clock.
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_piasters integer CHECK (sale_price_piasters IS NULL OR sale_price_piasters > 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_starts_at timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;
UPDATE products SET sale_price_piasters = 90000, sale_starts_at = now(), sale_ends_at = '2026-10-10 00:00:00+03', updated_at = now()
WHERE slug = 'quiet-confidence';
