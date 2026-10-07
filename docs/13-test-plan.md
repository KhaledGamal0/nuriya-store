# 13 — Test plan: what is tested automatically, and how

Every push to `main` runs two workflows. Nothing ships if they fail.

| Workflow | What runs | Where to read results |
|---|---|---|
| CI (`ci.yml`) | Install → real Postgres → migrate + seed twice → unit + database tests → build with DB → type check → build without DB | `ci-logs` branch |
| UI audit (`ui-audit.yml`) | Production build on real Postgres → server checks → browser flows on phone 390 px and desktop 1440 px with screenshots and accessibility scans → database refresh check → Lighthouse on mobile 4G | `ui-report` branch (`report.md`, `lighthouse.md`, `shots/`) |

## Coverage by business case

| Business case | Test | Type |
|---|---|---|
| Price always computed on the server; browser price ignored | `checkout.test.ts` "a price sent by the browser is ignored" | unit |
| Price comes from the database; a price change is charged at checkout | `db.test.ts` "a price change in the database is what checkout charges" | database |
| Price change shows on the site after a refresh | `ui-audit.mjs` refreshCheck | browser + DB |
| Delivery fee per area matches Direction's list | `checkout.test.ts` "shipping table…"; `db.test.ts` "storefront reads…" | unit + DB |
| Inactive delivery area cannot be used | `checkout.test.ts`, `db.test.ts` "a deactivated delivery area…" | unit + DB |
| Sold-out size shown as sold out and refused at checkout | `checkout.test.ts`, `db.test.ts` "a size with no stock…" | unit + DB |
| Unknown colour, size or area rejected | `checkout.test.ts` | unit |
| Quantities merged and capped at 5 | `checkout.test.ts` | unit |
| Egyptian mobile formats (010/011/012/015, +20, 0020) | `checkout.test.ts` | unit |
| Every bad field gets its own error message | `checkout.test.ts`; browser "checkout-errors" (focus moves to first error) | unit + browser |
| Errors clear once fixed; total updates by area (Alexandria = 1,290 EGP) | browser "checkout-filled" | browser |
| Full order reaches the confirmation page | browser "checkout-filled" → "order-placed" | browser |
| Database refuses bad data (negative stock, zero price, bad phone, wrong total, unknown status) | `db.test.ts` "the database itself refuses bad data" | database |
| Seeding is repeatable and never overwrites | `db.test.ts` "seeding twice changes nothing"; CI runs migrate + seed twice | database |
| Must choose a size; no size pre-selected | browser "add-without-size", "no-size-preselected" | browser |
| Size finder recommends by weight | `checkout.test.ts` "money and size helpers"; browser "size-finder" | unit + browser |
| Bag opens after adding, closes fully | browser "bag-open", "bag-close" | browser |
| Photo viewer: open, next, Escape | browser "photo-viewer" | browser |
| Header hides on scroll down, returns on scroll up; new pages open at the top | browser "header-scroll", "navigate-to-top" | browser |
| Arabic policy is right-to-left | browser "returns-arabic" | browser |
| Refresh endpoint rejects a wrong secret | ui-audit refreshCheck | browser |
| Security headers, no framework leak, cacheable pages | ui-audit techChecks | server |
| SEO: titles, descriptions, share images, product data, sitemap, robots, 404, checkout noindex | ui-audit techChecks | server |
| Accessibility (WCAG 2.2 AA), tap targets ≥ 44 px, no sideways scroll, no console errors | ui-audit on every page and state | browser |
| Speed budget (LCP, CLS, JS size, scores) | `scripts/lighthouse.mjs` | Lighthouse |
| Database down: shop pages still open, health reports 503 without leaking details, checkout shows a calm message, keeps the typed fields, never confirms an order | `scripts/outage-check.mjs` (UI audit, last step) | browser |
| Live site up (pages every 15 min, database every 6 h) | `uptime.yml` | scheduled |
| Backup can actually be restored | `db-backup.yml` restores each dump into a fresh Postgres | scheduled |

| Order saved with items, customer, history; COD → CONFIRMATION_NEEDED; prices from DB | `orders.test.ts` "a COD order is saved…" | database |
| Browser price never reaches the database | `orders.test.ts` | database |
| Same checkout twice / three taps at once → one order | `orders.test.ts`; browser "checkout-filled" double submit + "order-saved" DB check | database + browser |
| Key replayed with another phone refused; malformed key refused | `orders.test.ts` | database |
| Two buyers, last piece → one wins, stock reserved once | `orders.test.ts` | database (concurrency) |
| Refused order leaves no order and no reservation (rollback) | `orders.test.ts` | database |
| Price or delivery fee changed during checkout → refused; closed area refused; COD refused where off | `orders.test.ts` | database |
| Card refused until Paymob is connected | `orders.test.ts` | database |
| Blocked phone; max 3 orders per phone per day (even all at once); 10 attempts per device | `orders.test.ts` | database |
| Order lookup needs number AND phone, same message otherwise, no address shown, injection-safe | `orders.test.ts`; browser "track-order" | database + browser |
| Shop e-mail: sent once, retried after failure, never blocks the order, no duplicates | `orders.test.ts` | database |
| Database refuses wrong totals and reservations above stock | `orders.test.ts` | database |
| Thank-you page is idle (no render loop); links and title work after ordering | browser "order-placed" mutation count, "track-order" | browser |
| Orders not e-mailed within 10 min → phone alert | `order-watch.yml` (hourly) | scheduled |

## Robots, crowds and chaos (Oct 7 — before going public)
| Attack or situation | Test | Type |
|---|---|---|
| 5,000 random/garbage checkouts never crash; every accepted order adds up exactly; prices only from the catalog | `fuzz.test.ts` (seeded, replayable) | unit |
| Every phone format incl. Arabic numerals (٠١٠…, ۰۱۰…), +20, 0020, spaces, invisible marks | `fuzz.test.ts` | unit |
| SQL injection, XSS, NUL bytes, direction overrides, 100k-char inputs, emoji, Arabic text | `fuzz.test.ts` | unit |
| Tampered cart (qty 999, fake price, unknown items, prototype pollution, oversized cart) | `fuzz.test.ts`; browser "tampered bag" | unit + browser |
| Hostile names/addresses cannot inject HTML into the shop e-mail or break the WhatsApp link | `fuzz.test.ts` | unit |
| Order e-mail shows stock left, flags low/sold-out, cash to collect, product photo | `fuzz.test.ts` | unit |
| 200 orders at once: all saved once, complete, correct (books balance) | `load.test.ts` | database |
| 60 buyers race for 25 pieces: never oversold, reserved = sold | `load.test.ts` | database |
| One phone ×15 at once → 3 orders; one device ×30 at once → 10; same checkout ×20 at once → 1 | `load.test.ts` | database |
| 2,400 page requests, 50 at a time: no errors, p95 latency | `stress.mjs` "page load" | load |
| 30 real browsers buy the same size at once, 10 in stock → exactly 10 thank-you pages, 20 sold-out messages | `stress.mjs` "crowd" | browser + DB |
| Internet drops mid-order → calm message, form kept, retry works, 1 order | `stress.mjs` | browser + DB |
| Order saved but the answer is lost → tapping again returns the SAME order; refresh keeps the confirmation; Back doesn't re-order | `stress.mjs` | browser + DB |
| Bot fills the hidden field → refused, nothing saved | `stress.mjs` | browser + DB |
| One device spamming 11 orders / 22 lookups → limited | `stress.mjs` | browser |
| 320 px phone: no sideways scroll on any page | `stress.mjs` | browser |
| Slow 3G: full purchase completes | `stress.mjs` | browser |
| Refresh secret brute force (60 guesses) all refused | `stress.mjs` | server |

## Added in later phases
- P4: Paymob — success, decline, cancel, duplicate webhook, forged HMAC rejected, amount mismatch rejected, return URL never marks paid.
- P5: admin login with 2FA, roles, every change in the audit log, refresh after edits.
