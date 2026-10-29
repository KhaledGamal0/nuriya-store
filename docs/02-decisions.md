# 02 — Decisions log

## Confirmed by Khaled (Oct 7 2026)
| # | Topic | Decision |
|---|---|---|
| 1 | Price | **1200 EGP** — both colorways (Cream, Burgundy), both sizes |
| 2 | Payments | **Cash on delivery + card online** through a secured gateway — Paymob (he wrote "laymob") is the candidate. Card data never touches our server |
| 3 | Delivery | Courier = **Direction** — price list received (`03-shipping.md`) |
| 4 | Platform | **Fully custom** website (not Shopify) + **own domain** (to buy) |
| 5 | Fabric & care | Yes — will be provided (details still needed) |
| 6 | Policy | Return & exchange policy image provided — inspect with courier, closed after courier leaves (`04-policies.md`) |
| 7 | WhatsApp / email | Not now — consider later |
| 8 | Photos | Kit + some photos sent; more coming |
| — | Scope | **Admin dashboard from day one.** Plan next steps and future features now, build later. Priorities: fastest performance, strong unique identity, nothing templated/AI-generic |
| — | Process | **Khaled has something to tell before anything starts — do not build until he says go** |

## Still open
- Fabric composition, weight (GSM), care instructions (wash/iron)
- Damaged/wrong item handling (courier covers 80–100% of value on loss — see `03-shipping.md`; customer-facing rule still needed)
- Referral 10% tracking method (proposal: unique code per order printed/QR on thank-you card)
- Exact name of the condensed display serif from Canva
- Domain name choice (nuriya.eg? nuriya.com.eg? shopnuriya.com?) — check availability
- Paymob account (merchant onboarding needs commercial register/tax card or individual setup — verify current requirements)
- Stock quantities per colorway × size
- Delivery time wording: list says Cairo & Giza "within 90 hours" — almost certainly a typo (likely 48h); confirm with Direction
- Areas missing from the price list (North & South Sinai except Sharm, etc.) — confirm if Direction delivers there
- COD on all governorates or limit for far zones?
- Photo originals: the photos received are WhatsApp-compressed (≤1280 px, 20–260 KB). Site needs camera originals ≥2000×2500 → send originals (AirDrop/Drive "original quality") or plan a shoot
- Next products / colorways

## Phase 2 decisions (Oct 7 2026)
- Neon Postgres, region Frankfurt; connection strings only in Vercel / GitHub secrets, never in chat or code.
- Setup is automated (Khaled, Oct 7: "do everything from your side"): Khaled adds only NEON_API_KEY, VERCEL_TOKEN and BACKUP_PASSPHRASE as GitHub secrets; the "Production setup" workflow does the rest. Workflows read the database address from the Neon API at run time, so no connection string is stored anywhere except Vercel.
- Vercel preview deployments use a separate Neon branch "preview" (test data only), so test orders never land in the production database.
- Server functions pinned to Frankfurt (`vercel.json` regions fra1), next to the database.
- Phase 3 (Oct 7, Khaled: "orders sent to my mail khaledgamaldeveloper@gmail.com"): every new order is e-mailed to the shop (Resend), with a WhatsApp confirm link. The address is kept only in GitHub/Vercel secrets, never in code (public repo).
- Phase 3 defaults (announced to Khaled Oct 7, change any time): max 3 orders per phone per 24 h; 30 checkout attempts per device (IP) per 10 min — raised from 10 after the stress test showed shared mobile-carrier addresses (CGNAT) would block real customers during a drop; 20 order lookups per device per 10 min.
- Oct 7 (Khaled): starting stock Cream S/M 16, Cream L/XL 15, Burgundy S/M 17, Burgundy L/XL 15. Stock tracking on. All test orders deleted (backup kept 90 days).
- Oct 7 (Khaled): order e-mails go to nuriya.egy@gmail.com (Resend account under that address) and show stock left after each order.
- Oct 7 (Khaled): **card payments deferred** — Paymob needs business documents Nuriya doesn't have yet. Shop is cash on delivery only; card is hidden everywhere and refused by the server. Card wording reappears automatically when PAYMOB_ENABLED=1.
- Oct 7 (Khaled): the light colour is called **White** (not cream) on every screen, e-mail and address: /quiet-confidence/white (old /cream redirects). Internal id stays `cream`.
- Oct 7 (Khaled): domain nuriya.app. Full-HD photos replace the old screenshots in both galleries; kept only the two studio shots that add a look (cream styled, burgundy styled, burgundy hanger).
- Oct 7 (Khaled): homepage first screen = his two-colour photo (cream + burgundy), replacing the previous two photos.
- Card payment hidden and refused until Paymob is connected (Phase 4), so no unpaid card order can exist.
- Order lookup shows status, items, area and totals — never the address or full name.
- Failures of uptime, backup, migration or setup open a GitHub issue labelled "alert" (phone notification through the GitHub app) and close it when fixed.
- Stock tracking off per size until Khaled gives counts (all sizes available meanwhile).
- No size pre-selected on product pages (Khaled).
- Pages static + on-demand refresh (not timed refresh).

- Oct 7 2026 (Khaled): no scroll reveal/blur effects — text must never rest blurred. Content is always sharp.
- Oct 7 2026 (Khaled): removed 4 photos (burgundy model at the glass, burgundy with coat and scarf, burgundy on hanger, white with pleated trousers). Burgundy opens with the collar photo; White has 3 photos, Burgundy 3.
- Oct 7 2026 (Khaled): launch offer: 1,000 EGP instead of 1,200 (old price shown struck through; `products.compare_at_piasters`, set NULL to end the offer). Order tracking page removed for now (/track goes to the home page; lookup code kept). Size guide page no longer shows weight (weight helper stays on the product page).
- Oct 7 2026 (Khaled): offer ends by itself after 7 orders (both colours together, counted from the offer start; cancelled/expired don't count), then 1,200 EGP. Orders take pieces straight out of stock (no separate reservation). Tracking + admin come in the next phases (Phase 5).
- Oct 8 2026 (Khaled): launch-day sale 900 EGP (25% off 1,200) for both colours, from Oct 8 noon until Sat 10 Oct 00:00 Cairo; then back to 1,000 EGP (7-order offer, sale orders don't count). Khaled asked for a launch popup: allowed for this sale only (exception to the no-promo-popup rule): shown once per visit, after the page loads, never on checkout, accessible.
- Oct 8 2026 (Khaled): checkout area picker simplified: one "Cairo & Giza" option (75 EGP) covers Cairo, Giza and the new cities; fees unchanged and checked against the Direction list; each option shows its fee.
- Oct 8 2026 (Khaled): checkout phone is grouped as typed (010 1234 5678) with a live confirmation of the number; optional second mobile number ("Another mobile number"), shown in the order e-mail and the WhatsApp message.
- Oct 8 2026 (Khaled): visitor stats with Vercel Web Analytics (cookie-free, billed per event from the Pro usage credit, about $0.03 per 1,000 page views).
- Oct 8 2026 (Khaled): size chart corrected: S/M shoulder 56 / chest 112 / length 64; L/XL 60 / 120 / 67 (chest all around; old 56/60 were half-width).
- Oct 9 2026 (Khaled): launch sale (900 EGP) extended to Friday 16 Oct 2026, 11:59 pm Cairo.

- **Oct 11 2026 (Khaled):** product pages show "Model is 160 cm · 50 kg and wears S/M" under the size buttons and in Find my size (same model, both colours; real 161 cm / 51 kg, rounded by Khaled). Holding a photo on phones no longer opens the save/preview menu. UGC gift: 1 White L/XL taken out of stock (admin task take-out-stock).

- **Oct 12 2026 (Khaled: "do everything to make the ad reach more people"):** Meta Advanced Matching on Purchase (phone + name, hashed by the Pixel), `contents` on AddToCart/InitiateCheckout/Purchase, and Conversions API Purchase from the server (same event_id = order number, hashed phone/name, IP, user agent, _fbp/_fbc), sent after the order is saved. Privacy note added on Delivery and returns ("Your details").

- **Oct 12 2026 (Khaled: "best ad"):** Conversions API now also sends ViewContent / AddToCart / InitiateCheckout (browser note → /api/meta-event, same event_id as the Pixel; only our 3 events, our products, range-checked numbers, our own site only). Ad-click cookie _fbc (and _fbp) saved at landing. Browser Purchase gets external_id (hashed phone). Not done on purpose: phone/name at checkout before ordering (not submitted = not ours to share); WhatsApp button (no business number yet, and no floating elements in the design).

- **Oct 16 2026 (Khaled):** after the 900 sale ends (Fri Oct 16, 11:59 pm), the launch offer is counted in **pieces**, not orders: the first 7 pieces sold (both colours, all customers) are 1,000 EGP; from the 8th piece it is 1,200, even inside the same bag (that line is split, e.g. 2 × 1,000 + 1 × 1,200). Counted inside the order transaction under the product lock, so two buyers at once can never both get the last offer piece; a bag priced with pieces that are gone is refused with "price changed, refresh". When the last offer piece sells, the price becomes 1,200 for everyone. Sale-window pieces and cancelled orders do not count.

- **Oct 16 2026 (Khaled: keep offers reusable):** admin tasks start-offer / start-sale / end-offers so any future offer goes live in minutes (docs/14-operations.md → Prices and offers).

- **Oct 23 2026 (Khaled, ad match quality):** Purchase now also sends the delivery area as Meta state/city (hashed); returning buyers are matched on every event by external_id = SHA-256 of their phone, saved in their own browser at their last order (never the phone). Phone/name at checkout before ordering stays off (not submitted). Privacy note mentions the delivery area.

- **Oct 23 2026 (Khaled):** Advanced Matching on InitiateCheckout. Meta InitiateCheckout is now sent once per checkout visit as soon as she has typed a valid phone and her name (with ph 20XXXXXXXXXX, fn, ln, st/ct from the chosen area, country=eg; hashed by the Pixel in the browser and SHA-256 on the server, same event_id); if she leaves before that, it is sent without them. Vercel "5 · Opened checkout" unchanged. Checkout behaviour unchanged.

- **Oct 24 2026 (Khaled):** the offer popup also shows for the limited-pieces offer: "Limited launch offer · 17% off · 1,200 → 1,000 EGP · Limited pieces left at this price" (Khaled, same day: no number shown; no countdown), once per visit on the first page opened (any page except checkout), same look as the sale popup; hides by itself when the last offer piece sells.

- **Oct 25 2026 (Khaled, security hardening, no UI change):** added Content-Security-Policy, JSON-LD escaping, per-device limit on /api/meta-event, Dependabot + npm audit in CI, docs/15-security.md checklist. Repo stays PUBLIC (Khaled, Oct 25 2026): no secrets in code; private would cost ~$25/month in GitHub Actions minutes and lose free secret scanning.

- **Oct 25 2026 (Khaled):** every request is handled as his senior expert: context first, numbered to-do list, validate each point (technical, business, UI/UX, security) and propose a better option when needed, cover edge cases, stay lean, short English report. Saved in CLAUDE.md ("How to handle every request").

- **Oct 25 2026 (Khaled):** keep the 1,000 EGP offer for every order until the Meta ad ends, **Thu 29 Oct 2026, 9:00 pm Cairo**; from that second the first **7 pieces** (all customers, both colours) are 1,000, then 1,200 automatically. Done with start-offer `ends` = count-from time (offer_started_at in the future): before it no piece limit and the offer cannot end (bag + order).

- **Oct 25 2026:** Next.js 16.4.0 → 16.4.1 security patch merged (2 critical remote-code-execution flaws + 1 denial-of-service); CI, UI audit, live check and Vercel all passed.

- **Oct 25 2026 (Khaled, Meta match quality, no visible change):** anonymous visitor id (`nuriya_vid` cookie, 64 random hex, 1 year, first-party) sent as external_id on every browser and server event; server events add her scrambled phone as a 2nd external_id when known. PageView now also sent from the server (Conversions API) with the same event_id as the browser. Purchase/InitiateCheckout already send hashed ph (20XXXXXXXXXX — Meta wants digits only, no "+"), fn, ln, st/ct, country=eg. Homepage has no Add to bag (cards open the product page, where AddToCart fires). Privacy note mentions the random visitor ID.

- **Oct 26 2026 (Khaled):** **free delivery in Cairo & Giza** (incl. the new cities), until he says stop; Giza countryside (90) and New Capital (135) keep their fees. Fee 0 in the database (migration 0015), so every total is exact everywhere (bag, checkout, order, e-mail, WhatsApp, reports, Meta values). Screens say "Free" (never "0 EGP"): checkout picker "Cairo & Giza · Free delivery", summary, thank-you page, e-mails, bag panel, product page line, delivery page. Offer popup gets one line "Free delivery in Cairo & Giza" (popup still shows only while an offer runs; hides with the offer — Khaled). Everything reads the fee, so it shows/hides by itself. Change or end: Admin tasks → set-delivery-fee (refuses a fee zone shared by several areas). Nuriya still pays Direction 75 EGP per Cairo order.

- **Oct 26 2026 (Khaled):** lab JS 183 KB vs 180 budget after the Next.js/React security updates (not caused by free delivery). Real live speed fine (HTML ~0.2 s, all photos < 0.9 s on 4G). Decision: no code churn while the ad runs; trim our own client code back under 180 KB after Oct 29.
- **Oct 26 2026 (Khaled, update):** keep the 183 KB as is (caused by the framework update, customers do not feel it); touch it only if it grows above 183 KB or the real live speed drops.
- **Oct 26 2026 (Khaled):** offer count-from moved to **Thu 29 Oct 2026, 11:59 pm Cairo** (the ad runs until 11:59 pm, so the site matches "17% off" to the end). Done with admin task start-offer (1000 / 1200 / 7 / 2026-10-29 23:59).
- **Oct 27 2026 (Khaled):** admin task **cancel-order** (order number): open order → CANCELLED, pieces back in stock, history + audit; refuses unknown, delivered, with-courier or already-cancelled orders. Used for NUR-TRAYQS.
- **Oct 27 2026 (Khaled):** reports on time in Cairo time: one hourly "Reports clock" job (:19, works in Africa/Cairo so summer/winter changes need no edits; GitHub delayed on-the-hour jobs by 4–6 h) sends each report once (report_runs). Health warning 08:00 (not Sunday), daily sales 09:00 (= yesterday, clearly labelled, plus today so far), Sunday 09:00 weekly sales + weekly health, the 1st 09:00 monthly. Old crons removed.
- **Oct 29 2026 (Khaled):** 1,000 EGP for every order and free delivery in Cairo & Giza both run until **Sat 31 Oct 2026, 11:59 pm Cairo** (winter time, = 21:59 UTC). Then 7 pieces at 1,000, then 1,200; Cairo & Giza delivery back to 75 by itself (shipping_zones.promo_fee_piasters / promo_until, migration 0017; normal fee 75 set in 0018). Popup shows a countdown to that moment ("Until Sat 31 Oct 11:59 pm (Cairo time)"). Bag and checkout switch on the second; pages refresh within the hour (sale-end.yml now hourly).
- **Oct 29 2026 (Khaled):** popup: countdown in a plum box (white, bold numbers), free delivery in a pink-tint box (burgundy); no end-date line; focus goes to the title on open (no square around X).
- **Oct 29 2026 (Khaled):** popup back to the original look; order = kicker → 17% off → 1,200 → 1,000 → "+ Free delivery in Cairo & Giza" → one countdown box "Both offers end in …" (pink tint) → button. No date line.
- **Oct 29 2026 (Khaled):** Giza countryside hidden (shipping_areas.is_active = false, migration 0019) until he decides; checkout refuses it.
- **Oct 29 2026 (Khaled):** checkout lists the Cairo & Giza areas by name under one heading "Cairo & Giza · Free delivery": Cairo, Giza, then 6th of October, El Obour, El Shorouk, Hadayek October, Madinaty, New Cairo, Sheikh Zayed (same zone, same fee/promo; migration 0020). No notes or descriptions. Address placeholder: "District, street and building no., floor, apartment, landmark". Reports show each area by name.
