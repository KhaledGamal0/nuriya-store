-- Oct 29 2026 (Khaled): the customer picks her own area by name; no grouped "Cairo & Giza" option.
-- All of these share the Cairo & Giza zone: same fee and same free-delivery promo. Heading stays "Cairo & Giza".
UPDATE shipping_areas SET name_en = 'Cairo', name_ar = 'القاهرة' WHERE slug = 'cairo';
INSERT INTO shipping_areas (zone_id, slug, name_en, name_ar, is_active)
SELECT c.zone_id, v.slug, v.en, v.ar, true
FROM (SELECT zone_id FROM shipping_areas WHERE slug = 'cairo') c,
     (VALUES ('giza', 'Giza', 'الجيزة'),
             ('new-cairo', 'New Cairo', 'القاهرة الجديدة'),
             ('6th-of-october', '6th of October', '٦ أكتوبر'),
             ('sheikh-zayed', 'Sheikh Zayed', 'الشيخ زايد'),
             ('madinaty', 'Madinaty', 'مدينتي'),
             ('el-shorouk', 'El Shorouk', 'الشروق'),
             ('el-obour', 'El Obour', 'العبور'),
             ('hadayek-october', 'Hadayek October', 'حدائق أكتوبر')) AS v(slug, en, ar)
ON CONFLICT (slug) DO UPDATE SET zone_id = EXCLUDED.zone_id, name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar, is_active = true;
