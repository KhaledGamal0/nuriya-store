# 07 — Roadmap

## Phase 0 — Foundations (before code) ← WE ARE HERE
- [x] Brand book, asset kit, photos, IG screens collected
- [x] Price, payment methods, courier, platform, policy confirmed
- [ ] Hear Khaled's extra input (he asked to tell something before start)
- [ ] Fabric/care, damaged-item rule, card-refusal refund rule, referral tracking
- [ ] Domain bought; Paymob merchant account opened (test keys first)
- [ ] Original-quality photos (or shoot plan: shot list below)
- [ ] Stock count per variant
- [ ] Approve design direction (`08-design-direction.md`) → visual prototype of Home + Product on mobile

**Shot list for launch (per colorway):** front flat on cream paper · back · collar + zip close-up · chest embroidery close-up · sleeve embroidery · on model full body (old-money styling) · on model (casual) · detail in hand / coffee lifestyle · neck label. All 4:5, daylight, ≥ 3000 px long side.

## Phase 1 — Build MVP store + admin (target ~3–4 weeks of build)
1. Design system in code (tokens, type, buttons, cards, RTL-ready)
2. Storefront: Home, Product, Bag, Checkout, Order confirmation, Track order, Size guide, Policy, About, Contact (IG DM link)
3. COD flow end to end → then Paymob card flow (test mode) → HMAC webhook
4. Admin v1 (see `06-admin-dashboard.md`)
5. Emails/SMS-free confirmation page + WhatsApp confirm link
6. SEO, OG, analytics, Meta Pixel + CAPI
7. Security hardening + performance pass (budgets in `05-architecture.md`)

## Phase 2 — Launch
- UAT on real phones (iPhone + mid Android) on 4G; test orders COD + card (live small amount, then refund)
- Courier dry run (3 orders pickup)
- Soft launch to IG close friends → public launch with "Something beautiful is on its way." teaser → link in bio, story link stickers, highlight "HOW TO ORDER"
- Keep DM ordering working in parallel; admin lets Khaled enter DM orders manually

## Phase 3 — After launch (not now)
- Arabic RTL storefront (if not in v1)
- Referral program live, reviews/customer photos wall
- Waitlist + back-in-stock, drops with countdown & pre-orders
- Abandoned checkout follow-up, WhatsApp Business API notifications
- Courier API tracking, same-day option Cairo
- Analytics dashboard + profit view
- "Build your fit" styling tool, gift wrap/card note
- New products & colorways under the two-word naming pattern
- PWA install / loyalty for repeat girls
