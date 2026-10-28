-- Oct 29 2026 (Khaled): free delivery in Cairo & Giza ends by itself on Sat 31 Oct 2026, 11:59 pm Cairo time.
-- A zone can have a promotional fee until a moment; after it the normal fee applies with no manual step.
-- Effective fee = promo_fee_piasters while now() < promo_until, else fee_piasters.
-- This step only adds the promo (the normal fee is set to 75 in 0018, after the code that reads it is live).
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS promo_fee_piasters integer CHECK (promo_fee_piasters IS NULL OR promo_fee_piasters >= 0);
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS promo_until timestamptz;
UPDATE shipping_zones SET promo_fee_piasters = 0, promo_until = '2026-10-31 23:59:00'::timestamp AT TIME ZONE 'Africa/Cairo'
WHERE code = 'cairo-giza';
