-- Oct 26 2026 (Khaled): free delivery in Cairo & Giza (incl. the new cities), until he says stop.
-- Giza countryside (90) and the New Administrative Capital (135) keep their fees. Past orders keep what they paid.
-- Change or end it with Admin tasks → set-delivery-fee (area cairo, price 75 = back to normal).
UPDATE shipping_zones SET fee_piasters = 0 WHERE code = 'cairo-giza';
