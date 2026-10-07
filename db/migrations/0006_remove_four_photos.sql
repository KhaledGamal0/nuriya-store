-- Oct 7 2026 (Khaled): remove four photos from the shop. Burgundy now opens with the collar photo.
-- Data only; safe on a fresh database (nothing to delete, positions match the seed list).
DELETE FROM media WHERE src IN (
  '/images/burgundy-hd-lean.jpg', '/images/burgundy-styled.jpg', '/images/burgundy-hanger.jpg', '/images/cream-styled.jpg');
UPDATE media SET position = CASE src
  WHEN '/images/burgundy-hd-collar.jpg' THEN 0
  WHEN '/images/burgundy-hd-flatlay.jpg' THEN 1
  WHEN '/images/burgundy-hd-full.jpg' THEN 2
  ELSE position END
WHERE src IN ('/images/burgundy-hd-collar.jpg', '/images/burgundy-hd-flatlay.jpg', '/images/burgundy-hd-full.jpg');
