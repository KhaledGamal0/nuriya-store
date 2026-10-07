# 08 — Design direction (PROPOSAL — not approved yet)

Goal: a store nobody mistakes for a template or an AI-generated shop. Every signature element comes from **Nuriya's own world** — the binder, the paperclip, the Pantone chips, the hang tag, the embroidery, the thank-you card's wavy border — not from generic "luxury e-commerce" patterns.

## Avoid (the generic AI/template look)
Full-bleed hero + "Shop now" over a dark overlay · three-icon "free shipping / secure / returns" rows · rounded cards with drop shadows everywhere · gradient buttons · sticky promo popups · Inter font · emoji bullets · carousel of identical product tiles · fake reviews/badges.

## The concept: "her journal"
The site behaves like a calm personal journal/binder — Nuriya's Instagram boards brought to life. Soft pink paper, plum ink, lots of air.

Signature ideas (pick the strongest at prototype):
1. **Pantone-chip colorway picker** — colorways shown as real Pantone chips ("19-1532 TCX · Cherries Jubilee", "11-0608 TCX · Creamy White"). Tap a chip → the photos change. Directly from her styling boards
2. **Binder-ring edge** on the product page — the gallery sits on a "page" with the silver rings on the left (pure CSS/SVG, no images), echoing the Styling Inspo boards
3. **"Old money or casual?" switch** on the product page — same piece, the styling board under it flips between the two looks (her 57/43 poll made interactive; shows the old-money look first)
4. **Embroidery as the hero detail** — macro close-up of the stitch that slowly reveals; caption "Every stitch, every detail."
5. **Find my size by weight** — two tap inputs (weight → fit preference) → "S/M — oversized, relaxed" on a little paper size-tag card with a paperclip
6. **Hang-tag order status** — order confirmation and tracking shown as the pink hang tag with the gold chain; status stamped on it
7. **Wavy-border thank-you** — confirmation page mirrors the printed thank-you card (wavy plum border, "Thank you for supporting a dream that started with love.") + referral code — online and offline unboxing feel the same
8. **Real girls first** — model photos (her best-performing content) lead; inspo boards come second as "how to style it"
9. **Sleeve line as micro-copy** — "do what you love · love what you do" written in the sleeve script near the footer, as a quiet signature
10. **Quiet motion** — page-turn View Transitions between product and checkout, no bouncing, no parallax

## Layout notes
- Header: logo SVG centred, menu left, bag right, pink, hairline
- Home (mobile): logo lockup → model photo + "Not loud. Just unforgettable." → Pantone chip pair (Cream / Burgundy) → embroidery macro → "Four fits, one vibe" inspo strip → real girls (IG) → story line → plum footer
- Product: gallery 4:5 swipe with page dots; name in condensed serif caps; price 1,200 EGP in plum (never rose gold); chips; size buttons S/M · L/XL; Find my size; "Add to bag" plum pill; inspect-at-door note; details accordion (fabric, care, embroidery, delivery fee by governorate)
- Checkout: one page, phone first, governorate picker shows fee instantly, COD default with card option, policy line before "Place order"
- Type: condensed serif caps for titles; Poppins for everything read; numbers tabular
