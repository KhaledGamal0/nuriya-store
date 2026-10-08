-- Oct 8 2026 (Khaled): one checkout option "Cairo & Giza" instead of 8 separate places that all cost 75 EGP
-- (Cairo, Giza, Madinaty, El Shorouk, El Obour, 6th of October, Hadayek October, Sheikh Zayed).
-- The address field says exactly where. Old areas are switched off, not deleted (past orders keep them).
-- Giza countryside (90) and the New Administrative Capital (135) stay separate: different fees.
UPDATE shipping_areas SET name_en = 'Cairo & Giza', name_ar = 'القاهرة والجيزة' WHERE slug = 'cairo';
UPDATE shipping_areas SET is_active = false
WHERE slug IN ('giza', 'madinaty', 'el-shorouk', 'el-obour', '6th-of-october', 'hadayek-october', 'sheikh-zayed');
UPDATE shipping_zones SET label_en = 'Cairo & Giza' WHERE code = 'cairo-giza';
