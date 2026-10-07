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
- Stock tracking off per size until Khaled gives counts (all sizes available meanwhile).
- No size pre-selected on product pages (Khaled).
- Pages static + on-demand refresh (not timed refresh).
