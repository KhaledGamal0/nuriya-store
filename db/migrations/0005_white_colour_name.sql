-- Oct 7 2026 (Khaled): the light colour is called "White", not "Cream", everywhere customers see it.
-- Internal code stays 'cream' (stock, SKUs, saved bags). Past orders keep the name they were placed with.
UPDATE colorways SET name_en = 'White', swatch_hex = '#FFFFFF', detail_en = 'White body, burgundy collar and burgundy embroidery.'
WHERE code = 'cream';
UPDATE colorways SET detail_en = 'Burgundy body, white collar and white embroidery.'
WHERE code = 'burgundy';
UPDATE media SET alt_en = CASE src
  WHEN '/images/cream-hd-model.jpg' THEN 'Smiling girl in the white Quiet Confidence quarter-zip with a burgundy collar, wide-leg jeans and an iced coffee'
  WHEN '/images/cream-hd-chest.jpg' THEN 'Close-up of the white quarter-zip: burgundy collar, ring-pull zip and burgundy QUIET CONFIDENCE embroidery'
  WHEN '/images/cream-hd-sleeve.jpg' THEN 'White cuff embroidered in burgundy: do what you love, love what you do'
  WHEN '/images/cream-styled.jpg' THEN 'White quarter-zip styled with pleated trousers and a belt'
  WHEN '/images/burgundy-hd-lean.jpg' THEN 'Girl in the burgundy Quiet Confidence quarter-zip with a white collar and wide-leg jeans'
  WHEN '/images/burgundy-hd-flatlay.jpg' THEN 'Burgundy quarter-zip laid flat: white collar, Nuriya label, ring-pull zip and white embroidery on the chest and sleeve'
  WHEN '/images/burgundy-hd-collar.jpg' THEN 'Burgundy quarter-zip worn with jeans, hand at the white collar'
  WHEN '/images/burgundy-styled.jpg' THEN 'Burgundy quarter-zip styled with a long coat and light trousers'
  ELSE alt_en END;
