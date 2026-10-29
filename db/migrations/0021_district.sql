-- Oct 29 2026 (Khaled, option B): checkout = governorate → area (Cairo and Giza only, from a list) → address.
-- The governorate list keeps Cairo and Giza; the new cities move into the area list (orders.district).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS district text CHECK (district IS NULL OR char_length(district) BETWEEN 2 AND 60);
UPDATE shipping_areas SET is_active = false
WHERE slug IN ('new-cairo', '6th-of-october', 'sheikh-zayed', 'madinaty', 'el-shorouk', 'el-obour', 'hadayek-october');
