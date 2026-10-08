-- Oct 8 2026 (Khaled): optional second mobile number on an order, so the courier and the shop can
-- still reach the customer if the first number doesn't answer.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS alt_phone text CHECK (alt_phone IS NULL OR alt_phone ~ '^01[0125][0-9]{8}$');
