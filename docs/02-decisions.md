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
