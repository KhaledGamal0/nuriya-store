# 10 — Build plan with acceptance checklists

Rule: a phase is DONE only when every box is ticked AND Khaled approved the preview on his phone.
What Khaled must provide is marked 🟣.

## Phase 0 — Setup (½ day)
- [ ] 🟣 GitHub account/repo access · 🟣 Vercel account · 🟣 Neon (Postgres) account — free tiers fine until launch
- [ ] Repo created with this docs folder, brand assets, CLAUDE.md
- [ ] Next.js 16 + TS strict + lint + format + Vitest + Playwright + CI (GitHub Actions: typecheck, lint, test, build)
- [ ] Preview deploy on Vercel works
**Accept:** empty site with Nuriya favicon deploys on every push; CI green.

## Phase 1 — Design system + visual prototype (3–4 days)
- [ ] Tokens (colors, type scale, spacing, radii) from `01-brand.md`; fonts self-hosted + subset; logo SVG component
- [ ] Components: header, footer, buttons, Pantone chip, size buttons, inputs, accordion, hang-tag card, wavy-border card, binder-ring page edge
- [ ] Static prototype pages with real photos: Home, Product (both colorways), Bag, Checkout (UI only)
- [ ] Mobile 390 px first, then tablet/desktop; RTL check of components
**Accept:** 🟣 Khaled approves look & feel on his phone · nothing looks like a template · Lighthouse mobile ≥ 95 · logo always SVG.

## Phase 2 — Data + storefront live data (3–4 days)
- [x] DB schema (products, variants, media, shipping zones/areas, customers, orders, order_items, payments, order_events, discount codes, content blocks, audit log) + migrations. Admin users come from Better Auth in P5
- [x] Seed: Quiet Confidence quarter-zip, Cream/Burgundy × S/M, L/XL, 1200 EGP; shipping zones from `data/shipping-zones.json`; policy text
- [ ] 🟣 stock per variant, fabric/care text, original photos
- [x] Pages render from DB (static + on-demand refresh instead of timed ISR); image pipeline (AVIF/WebP, sizes)
- [x] Find my size (weight → size), size guide, policy, contact (IG DM). About page → P6
**Accept:** ✅ price change in DB shows after refresh (UI audit) · ✅ sold-out variant can't be added (DB test) · ⏳ production Neon connected (Khaled) · ⏳ stock counts (Khaled).

## Phase 3 — Cart + checkout + COD (3 days)
- [x] Bag (server-validated), one-page checkout: phone → name → governorate/area (fee instantly) → address → payment
- [x] Server re-prices everything; stock reserved in a transaction; order number NUR-XXXXXX (random, unguessable — kept from Phase 2)
- [x] COD → CONFIRMATION_NEEDED; confirmation page + track-order page (`/track`) — kept in the approved clean style
- [x] Rate limits + Egyptian phone validation + per-phone order limit
- [x] Added: no duplicate orders (idempotency key), price-change refusal, shop e-mail with WhatsApp link + hourly safety net
- [ ] Khaled: Resend key for the order e-mail; full COD order on his phone in < 60 s
**Accept:** tampered price in request is ignored (test) · two buyers can't buy the last item (test) · full COD order works on phone in < 60 s.

## Phase 4 — Paymob card payments (2–3 days)
- [ ] 🟣 Paymob merchant account + test keys (integration id, secret, public key, HMAC secret)
- [ ] Intention API → hosted Unified Checkout redirect
- [ ] Webhook: HMAC verify, amount/currency/order match, idempotent, payments table stores raw callback
- [ ] Stock hold expiry for unpaid card orders; failed/cancelled payment handling
**Accept:** success, decline, cancel, duplicate webhook, forged webhook (rejected) all tested · return URL alone never marks paid.

## Phase 5 — Admin dashboard v1 (5–6 days)
- [ ] Better Auth login + TOTP 2FA + roles (owner/staff) + audit log
- [ ] Today view, orders list/filters/search, order page timeline, status actions, WhatsApp confirm link
- [ ] Courier export (Direction sheet) + packing slip print
- [ ] Products/variants/stock/media manager, shipping zones editor, discount codes, customers (refused-count flag, blocklist), content blocks, policy editor
- [ ] Manual order entry (for DM orders)
**Accept:** 🟣 Khaled runs a full day of fake orders from his phone without help · every change logged.

## Phase 6 — Polish, SEO, analytics, security, launch prep (3 days)
- [ ] Product structured data, OG image, sitemap, hreflang, 404/500 pages
- [ ] Meta Pixel + Conversions API, analytics, UTM from IG bio/stories
- [ ] Order emails (Resend), admin new-order notification
- [ ] CSP + headers, dependency audit, backups, Sentry, uptime check
- [ ] Accessibility pass (keyboard, contrast, labels, alt text)
- [ ] 🟣 Domain bought → connected, HTTPS, Paymob live keys
**Accept:** Lighthouse mobile ≥ 95 all pages · security headers A · real live card order + refund done · courier dry run of 3 orders.

## Phase 7 — Launch → then roadmap Phase 3 items (`07-roadmap.md`)
Arabic RTL storefront (if not done), referral, reviews/UGC, waitlist/drops, abandoned checkout, courier API, analytics + profit view.

## Progress log
| Date | Phase | Status | Notes |
|---|---|---|---|
| 2026-10-07 | Planning | Done | Brand, decisions, shipping, policy, architecture, admin, design direction, review saved |
| 2026-10-07 | Design | Prototype v1 | Working storefront prototype (home, PDP, bag drawer, fit finder, checkout with Direction fees, confirmation) — `prototype/storefront-template.html`. Direction approved by Khaled: white editorial, plum ink, pink as small accent, full-bleed real photos. Blocked here: npm registry + GitHub push (403) — real Next.js build needs GitHub App install or local Claude Code |
| 2026-10-07 | 0–1 | Built, CI green | Next.js 16 app: home, product pages (cream/burgundy), bag dialog, menu dialog, find-my-size sheet, checkout (server action, server-side pricing, Direction fees), confirmation, size guide, returns EN/AR, 404, sitemap, robots, security headers, JSON-LD. 8 unit tests on pricing/validation. GitHub Actions: install, test, build, typecheck all pass. Next: connect Vercel for preview links; commit package-lock; Phase 2 (DB). |
| 2026-10-07 | 2 | Built, CI green | Postgres schema + seed, storefront and checkout read from DB, sold-out sizes, on-demand refresh, DB deploy workflow. 18 tests (7 on a real database). Waiting on Neon + stock counts. |
