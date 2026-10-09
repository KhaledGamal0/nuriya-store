-- Oct 9 2026 (Khaled): extend the 900 EGP launch sale to Friday 16 Oct 2026, 11:59 pm Cairo time.
UPDATE products SET sale_ends_at = '2026-10-16 23:59:00+03', updated_at = now()
WHERE slug = 'quiet-confidence' AND sale_price_piasters IS NOT NULL;
