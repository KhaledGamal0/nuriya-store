# 05 — Architecture (PROPOSAL — confirm with Khaled before building)

## Principles
1. Mobile first — visitors arrive from Instagram on phones, often on 4G
2. Fast by default — most pages pre-rendered HTML, near-zero JS until needed
3. Money logic only on the server — the browser never decides price, shipping or discount
4. Card data never touches Nuriya servers — gateway-hosted payment page
5. Everything editable from admin — prices, stock, shipping fees, content — no redeploy for business changes
6. Bilingual from the data model up — EN + AR (RTL) fields from day one, even if AR UI ships second

## Stack (proposed)
| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16.x (App Router, latest stable) + TypeScript | Static/ISR pages for speed, server actions for checkout, one codebase for store + admin |
| Styling | Hand-written CSS with brand tokens (CSS variables + modules) | No UI kit → no template look; tiny CSS |
| DB | PostgreSQL (managed: Neon / Supabase) + Drizzle ORM | Relational orders/stock, transactions for stock reservation |
| Images | Original uploads → stored in object storage (Cloudflare R2 / S3), served as AVIF/WebP at responsive sizes via image CDN | Biggest performance lever |
| Hosting | Vercel (or Cloudflare) — edge CDN | Global CDN; Egypt latency served from nearby PoPs |
| Admin auth | Better Auth — email + password (argon2id) + **TOTP 2FA**, httpOnly secure cookies, admin on separate path, roles (owner / staff) | Admin can see customer data & money |
| Email/notifications | Resend (or similar) for order emails; WhatsApp Business API later | |
| Analytics | Privacy-light analytics + Meta Pixel + Conversions API (server-side) | IG ads attribution survives iOS blocking |
| Monitoring | Sentry errors + uptime checks + DB backups daily | |

Alternative considered: Shopify (fastest to launch, but templated look + fees + less control — Khaled chose fully custom). Medusa.js headless (heavier than needed for a 1-product brand).

## Performance budget (hard limits)
- LCP < 2.0 s on mid-range Android, 4G · CLS < 0.05 · INP < 200 ms
- JS shipped on product page < 90 KB gzip; home < 70 KB
- Hero image ≤ 180 KB AVIF at mobile width, preloaded; all others lazy
- Fonts: self-hosted, subset (Latin for Poppins, Arabic subset for Plex), `font-display: swap`, max 3 files on first load; logo is inline SVG (0 font requests)
- No carousels libraries, no jQuery, no heavy animation libs — CSS transitions + View Transitions API
- Lighthouse mobile ≥ 95 all categories as launch gate

## Data model (core)
- `products` (slug, name_en/ar, story, care, status, drop_id)
- `variants` (product, colorway, size, sku, price_egp, **stock_on_hand**, stock_reserved)
- `media` (variant/product, type: front/back/collar/embroidery/model, alt_en/ar, focal point)
- `shipping_zones` + `areas` (fee, eta, cod_allowed, active)
- `customers` (name, phone (primary key for Egypt), email optional, addresses)
- `orders` (number NUR-0001, status, payment_method COD|CARD, payment_status, subtotal, shipping, discount, total — all stored as integers in piasters)
- `order_items`, `payments` (gateway ids, raw callback, HMAC verified flag), `order_events` (audit timeline)
- `discount_codes` / `referrals`, `content_blocks` (hero, inspo boards), `admin_users`, `audit_log`

## Checkout & payment flow
```
Bag → Checkout (1 page): phone → name → governorate/area → address → payment (COD | Card)
  server: re-price items from DB, compute shipping from zone, validate stock, apply code
  server: create order (status PENDING), reserve stock (DB transaction, 30 min hold for card)
COD  → order CONFIRMATION_NEEDED → admin/WhatsApp confirms → CONFIRMED → ready to ship
CARD → server creates Paymob payment intention (amount from DB, merchant order id = our order id)
     → redirect to Paymob hosted checkout (card never on our site)
     → Paymob server callback (webhook) → verify HMAC signature → check amount + currency + order id match
       → idempotent update: PAID → CONFIRMED  (duplicate callbacks ignored)
     → browser return URL only shows status; it NEVER marks an order paid
     → no callback within hold window → release stock, mark EXPIRED
Fulfilment: CONFIRMED → PACKED → HANDED_TO_COURIER (tracking no.) → DELIVERED | REFUSED_AT_DOOR
  REFUSED (COD): stock back, no money involved. REFUSED (card): refund item via gateway (policy decision needed)
```
Paymob specifics (API names, intention/HMAC fields, onboarding docs) to be checked against current Paymob docs at build time.

## Security checklist
- HTTPS + HSTS, strict CSP (no inline scripts except hashed), X-Frame-Options/frame-ancestors deny, Referrer-Policy
- All input validated server-side (zod); output escaped; parameterised queries only (ORM)
- Secrets only in environment variables; gateway secret + HMAC key never in client bundle; separate test/live keys
- Rate limiting on checkout, login, coupon apply, order lookup (stop coupon brute-force and fake COD floods)
- COD fake-order defence: Egyptian phone format validation, per-phone/IP order limits, admin confirm step, optional OTP later, blocklist for repeat refusers
- Admin: 2FA, short sessions, login alerts, role permissions, full audit log of price/stock/status changes
- PCI scope minimal (hosted payment page → no card data stored or processed by us)
- Daily DB backups + point-in-time restore; dependency updates via Renovate/Dependabot
- Privacy: collect only what delivery needs; privacy page; customer data export/delete on request

## SEO & sharing
- Server-rendered pages, Product + Organization structured data (price in EGP, availability), OG image from kit, sitemap, clean URLs `/p/quiet-confidence-quarter-zip?c=burgundy`
- `hreflang` en / ar

## Data flow (built in Phase 2)
- Schema: `db/migrations/*.sql` (plain SQL, applied in order by `scripts/db-migrate.ts`, recorded in `schema_migrations`). Drizzle table definitions in `lib/db/schema.ts` are for typed queries only.
- Reads: `lib/store.ts` → `getCatalog()` and `getAreas()`. Without `DATABASE_URL` they return the built-in data (`lib/catalog.ts`, `data/shipping-zones.json`).
- Pages are static. They are rebuilt only when data changes: `refreshStorefront()` (server code) or `POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET`. Timed ISR (`revalidate = 60`) was tried and removed: it left Next.js router prefetches hanging in the browser.
- Checkout always re-reads the database at the moment of ordering, so a stale page can never sell a wrong price or a sold-out size.
- Stock: `variants.track_inventory` is false until real counts exist; then available = `stock_on_hand − stock_reserved > 0`.
- Environment: `DATABASE_URL` (Neon pooled, on Vercel), `REVALIDATE_SECRET` (Vercel), repository secret `DATABASE_URL` (Neon direct) for `.github/workflows/db-deploy.yml`.
