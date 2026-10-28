-- Oct 29 2026: Cairo & Giza normal delivery fee back to 75 EGP. Customers still pay 0 until the promo ends
-- (promo_until = Sat 31 Oct 2026 23:59 Cairo, migration 0017); after that 75 applies by itself.
UPDATE shipping_zones SET fee_piasters = 7500 WHERE code = 'cairo-giza';
