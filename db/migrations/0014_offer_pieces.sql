-- Launch offer counted in PIECES, not orders (Khaled, Oct 16 2026): the first 7 pieces sold after the sale
-- (both colours together, all customers) are 1,000 EGP; from the 8th piece it is 1,200, even inside the same bag.
-- Pieces sold during a timed sale don't count. offer_orders_limit is kept (unused) so the running site keeps working
-- until the new code is live.
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_pieces_limit integer
  CHECK (offer_pieces_limit IS NULL OR offer_pieces_limit > 0);

UPDATE products SET offer_pieces_limit = 7, updated_at = now()
WHERE slug = 'quiet-confidence' AND compare_at_piasters IS NOT NULL AND offer_pieces_limit IS NULL;
