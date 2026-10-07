-- Oct 7 2026 (Khaled):
-- 1) The 1,000 EGP launch offer ends by itself after 7 orders (both colours together, counted from now;
--    cancelled/expired orders don't count). Then the price goes back to 1,200 EGP automatically.
-- 2) An order takes pieces straight out of stock (stock_on_hand goes down), instead of only reserving them.
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_orders_limit integer CHECK (offer_orders_limit IS NULL OR offer_orders_limit > 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_started_at timestamptz;
UPDATE products SET offer_orders_limit = 7, offer_started_at = now()
WHERE slug = 'quiet-confidence' AND compare_at_piasters IS NOT NULL AND offer_orders_limit IS NULL;

-- Existing reservations become real deductions: pieces available to sell stay exactly the same.
UPDATE variants SET stock_on_hand = stock_on_hand - stock_reserved, stock_reserved = 0 WHERE stock_reserved > 0;
