-- Oct 7 2026: Khaled's full-HD photos replace the compressed Instagram screenshots (all 4:5, true colour).
-- Data only. On a fresh database (CI) there are no colourways yet, so this inserts nothing and the seed adds the same list.
DELETE FROM media WHERE colorway_id IN (
  SELECT c.id FROM colorways c JOIN products p ON p.id = c.product_id WHERE p.slug = 'quiet-confidence');
INSERT INTO media (colorway_id, src, alt_en, width, height, kind, position)
SELECT c.id, v.src, v.alt, v.w, v.h, v.kind, v.pos
FROM (VALUES
  ('cream', '/images/cream-hd-model.jpg', 'Smiling girl in the cream Quiet Confidence quarter-zip with a burgundy collar, wide-leg jeans and an iced coffee', 1500, 1875, 'model', 0),
  ('cream', '/images/cream-hd-chest.jpg', 'Close-up of the cream quarter-zip: burgundy collar, ring-pull zip and burgundy QUIET CONFIDENCE embroidery', 1170, 1462, 'detail', 1),
  ('cream', '/images/cream-hd-sleeve.jpg', 'Cream cuff embroidered in burgundy: do what you love, love what you do', 1170, 1462, 'detail', 2),
  ('cream', '/images/cream-styled.jpg', 'Cream quarter-zip styled with pleated trousers and a belt', 1360, 1700, 'styled', 3),
  ('burgundy', '/images/burgundy-hd-lean.jpg', 'Girl in the burgundy Quiet Confidence quarter-zip with a cream collar and wide-leg jeans', 1300, 1625, 'model', 0),
  ('burgundy', '/images/burgundy-hd-flatlay.jpg', 'Burgundy quarter-zip laid flat: cream collar, Nuriya label, ring-pull zip and white embroidery on the chest and sleeve', 1590, 1987, 'flat', 1),
  ('burgundy', '/images/burgundy-hd-collar.jpg', 'Burgundy quarter-zip worn with jeans, hand at the cream collar', 1300, 1625, 'model', 2),
  ('burgundy', '/images/burgundy-hd-full.jpg', 'Full-length look: burgundy quarter-zip, wide-leg jeans and white trainers', 1480, 1850, 'model', 3),
  ('burgundy', '/images/burgundy-styled.jpg', 'Burgundy quarter-zip styled with a long coat and cream trousers', 1360, 1700, 'styled', 4),
  ('burgundy', '/images/burgundy-hanger.jpg', 'Burgundy quarter-zip with a white collar on a hanger', 1600, 2000, 'flat', 5)
) AS v(code, src, alt, w, h, kind, pos)
JOIN colorways c ON c.code = v.code
JOIN products p ON p.id = c.product_id AND p.slug = 'quiet-confidence';
