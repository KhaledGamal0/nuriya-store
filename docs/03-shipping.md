# 03 — Shipping: Direction courier (price list received Oct 7 2026)

Source image: `brand-assets/reference/direction-courier-pricelist.jpg`. Fees in EGP. Seed data: `data/shipping-zones.json`.

| Zone | Areas | Fee |
|---|---|---|
| Greater Cairo | القاهرة والجيزة Cairo & Giza | 75 |
| New cities | مدينتي، الشروق، العبور، أكتوبر، حدائق أكتوبر، الشيخ زايد | 75 |
| Delta & Canal | أرياف الجيزة، الإسكندرية، البحيرة، الغربية، الدقهلية، القليوبية، كفر الشيخ، المنوفية، الإسماعيلية، السويس، بور سعيد، دمياط، الشرقية | 90 |
| Upper Egypt north | الفيوم، بني سويف | 100 |
| Upper Egypt | المنيا، أسيوط، سوهاج، قنا، الأقصر، أسوان | 105 |
| New Valley | الوادي الجديد | 125 |
| New Capital | العاصمة الإدارية الجديدة | 135 |
| Resorts | البحر الأحمر (الغردقة)، شرم الشيخ، الساحل الشمالي، مرسى مطروح | 165 |

## Courier terms (from the list)
- Delivery: Cairo & Giza within "90 hours" (likely typo — confirm), other governorates within 72 hours from pickup
- **No fees** on pickup, partial returns, refused orders, or COD cash collection — only the shipping fee is charged
- Urgent **Same Day** orders = double shipping fee, limited areas only
- Pickup minimum: 3 orders (by agreement)
- Lost/damaged shipment compensation: 80% of shipment value for force-majeure reasons; 100% otherwise

## Why this matters for the site
- Refused COD orders cost Nuriya only the shipping fee → the inspect-at-door policy is cheap to run, COD can stay open everywhere
- Fee shown at checkout by governorate (+ area for Cairo/Giza/new cities) — editable in admin, never hard-coded
- Same-day can become a paid option later for Cairo zones
- Batch "ready to ship" orders into pickups of ≥3
