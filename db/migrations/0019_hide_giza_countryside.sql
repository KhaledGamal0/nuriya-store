-- Oct 29 2026 (Khaled): hide "Giza countryside" from checkout and the delivery page until he decides what to do.
-- Switched off, not deleted: past orders keep it; turn it back on with is_active = true.
UPDATE shipping_areas SET is_active = false WHERE slug = 'giza-countryside';
