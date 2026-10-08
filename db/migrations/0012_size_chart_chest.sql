-- Oct 8 2026 (Khaled): corrected size guide. Chest is the full measurement all around
-- (the old 56 / 60 were the flat half-width). Shoulder and length unchanged.
UPDATE size_chart SET shoulder_cm = 56, chest_cm = 112, length_cm = 64 WHERE size = 'S/M';
UPDATE size_chart SET shoulder_cm = 60, chest_cm = 120, length_cm = 67 WHERE size = 'L/XL';
