# 11 — Master tracker: every business need, and where it stands

Status: **DONE** · **PARTIAL** (started, not finished) · **P2–P7** (planned phase, see `10-build-plan.md`) · **LATER** (after launch) · **KHALED** (needs a decision or input from Khaled).
Update this file in the same commit as the work. Last update: 2026-10-07.

## A. Brand and content
| Need | Status | Notes |
|---|---|---|
| Brand book, tokens, logo SVG, favicon, share image in the project | DONE | `docs/01-brand.md`, `brand-assets/` |
| Logo always from the SVG, never typed | DONE | `components/Logo.tsx` |
| Product copy, details, size chart | DONE | `lib/catalog.ts` |
| Fabric composition, weight, care instructions | KHALED | Shown as "coming soon" until provided |
| Original full-quality photos (or a shoot) | DONE | Oct 7: 7 full-HD photos (4 burgundy, 3 cream) replace the compressed screenshots; all 4:5, true colour, light sharpening only. Originals in `brand-assets/photos-hd/` |
| Own domain | DONE | nuriya.app (Khaled, Oct 7); site address read from Vercel automatically (`lib/site.ts`) |
| Burgundy sleeve close-up taken from the embroidery reel (1264×1580) | DONE | |
| Real model photos for both colours, cut clean from Khaled's Instagram screenshots (1290×1612) | DONE | Cream 5 photos, burgundy 6; new hero; originals still sharper |
| AI styling images received Oct 7 | NOT USED | 7 of 8 misspell the logo (Nariya, Nsriya, Nautiga, Nauljpa) or invent the sleeve embroidery; none is sharper than the HD boards already used. Usable for Instagram only after fixing the logo. |
| Stock count per color and size | DONE | Oct 7: Cream S/M 16, L/XL 15; Burgundy S/M 17, L/XL 15. Change any time: Actions → Admin tasks → set-stock |
| Stock left shown in every order e-mail (low ≤ 3 and sold-out flagged) | DONE | `lib/notify.ts` |
| Redesigned order e-mail (logo, order number, WhatsApp + Call buttons, deliver-to card, items with photos, cash to collect) | DONE | |
| Admin tasks from the phone: set stock, reset test orders (backup first, all-or-nothing, live refresh) | DONE | `.github/workflows/admin-tasks.yml` |
| Homepage hero: Khaled's two-colour photo (enhanced), phone full-bleed, desktop editorial split | DONE | `public/images/hero-pair.jpg` |
| Exact Canva display font name | KHALED | Using Instrument Serif meanwhile |
| About / story page | P6 | Copy exists in brand book |
| Arabic storefront (real RTL) | LATER | Data model ready for AR from P2 |

## B. Storefront experience
| Need | Status | Notes |
|---|---|---|
| Home: hero, collection, craft image | DONE | |
| Product page per color, gallery, color + size choice | DONE | |
| Must choose a size before adding to bag | DONE | |
| Find my size by weight | DONE | |
| Bag panel, quantities, remove, remembered on return | DONE | |
| Menu panel (compact) | DONE | Redesigned after review on Oct 7 |
| Size guide page, delivery and returns page (EN/AR) | DONE | |
| One consistent control style, no stray circles | DONE | `docs/12-ui-standards.md` |
| Desktop header text links, two-photo hero, even gallery grid | DONE | Oct 7 polish |
| Checkout: live validation, errors clear when fixed, focus first error, summary on top for phones | DONE | |
| Automated UI/UX audit on every push (phone + desktop, accessibility, tap targets, flows) | DONE | `scripts/ui-audit.mjs`, results on the `ui-report` branch — 0 findings on Oct 7 |
| 404 page | DONE | |
| Panels slide out smoothly when closing (all browsers) | DONE | |
| Header hides on scroll down, returns on scroll up; current page underlined | DONE | |
| Page fade between pages, scroll reveal, "Added to bag" confirmation, hover underlines | DONE | |
| Footer redesign (brand line, Instagram, Shop/Help/Follow, payment methods) | DONE | |
| Full-screen photo viewer (tap, arrows, keyboard, counter), tappable gallery bars | DONE | |
| Sticky buy bar on phones | REMOVED | Oct 7: page below the button is too short for it to help; it overlapped the footer |
| No size pre-selected (Khaled, Oct 7); "Also in …" card | DONE | |
| Every page opens at the top | DONE | Audit check |
| Delivery and returns page: policy cards, EN/AR switch with real RTL, readable fees | DONE | |
| Sold-out sizes (disabled button, refused at checkout) | DONE | Turns on per size when stock tracking is enabled |
| "Notify me" when back in stock | LATER | |
| Reviews / customer photos | LATER | |
| Wishlist, search, filters | LATER | Not needed with one product |

## C. Checkout and orders
| Need | Status | Notes |
|---|---|---|
| Guest checkout by phone, no account | DONE | |
| Egyptian mobile validation | DONE | 010/011/012/015 |
| Area picker with Direction fees, live total | DONE | 35 areas |
| Server recomputes every price and fee | DONE | Unit tested |
| Inspect-at-door policy shown before placing order | DONE | |
| Order confirmation page | DONE | |
| Save orders in a database | DONE | One transaction: customer, order, items, history, stock. Thank-you page only after the save. `lib/orders.ts` |
| No duplicate orders from double taps or retries | DONE | One key per checkout attempt; tested in DB (3 taps at once) and in the browser |
| Stock reserved when ordering, no overselling | DONE | Row locks; "two buyers, last piece" test. Releasing stock on cancel comes with admin (P5) |
| Price or fee changed during checkout is refused, never charged silently | DONE | |
| Rate limits and fake-order protection | DONE | 30 attempts / device / 10 min (shared carrier IPs); 3 orders / phone / 24 h; blocklist; bot trap field |
| WhatsApp confirmation link for each COD order | DONE | In the order e-mail (pre-written message). Automatic sending later |
| Order e-mail to the shop | PARTIAL + KHALED | Code done and tested; needs Resend key (`RESEND_API_KEY`, `ORDER_ALERT_EMAIL` secrets). Hourly Order watch alerts if any order is not e-mailed |
| Thank-you page render loop (blocked taps after ordering) | FIXED | Oct 7: bag `clear()` was re-created and re-ran forever; audit now detects render loops |
| Aggressive pre-launch testing: fuzz (5,000 random checkouts), crowd (30 browsers, 200 DB orders at once), chaos (offline, lost answer, tampering, bots, slow 3G, 320 px) | DONE | `tests/fuzz.test.ts`, `tests/load.test.ts`, `scripts/stress.mjs` — every push |
| Arabic numerals in phone numbers accepted | FIXED | Oct 7: ٠١٠… was refused before |
| Internet drop mid-order shows a calm message and keeps the form | FIXED | Oct 7: used to show the error page |
| Order tracking page for customers | DONE | `/track` — needs order number + phone; never shows the address |
| Order emails / SMS | P6 | Email optional (phone-first) |
| Referral 10% code | LATER + KHALED | How to track it is undecided |
| Discount codes | P5 | |

## D. Payments
| Need | Status | Notes |
|---|---|---|
| Cash on delivery | DONE | Saved as CONFIRMATION_NEEDED; refused where the zone has COD off |
| Card option hidden until Paymob is live | DONE | `PAYMOB_ENABLED`; server refuses card meanwhile |
| Card via Paymob hosted page | P4 + KHALED | Needs Paymob merchant account and test keys |
| Paid only after verified Paymob webhook | P4 | |
| Refund rule when a card order is refused at the door | KHALED | Full refund, or keep delivery fee? |
| Damaged or wrong item rule | KHALED | |

## E. Delivery
| Need | Status | Notes |
|---|---|---|
| Direction price list as data | DONE | `data/shipping-zones.json` |
| Fees editable in admin | P5 | |
| Courier export sheet (Excel/CSV) | P5 | |
| Delivery time wording ("90 hours" typo) and Sinai coverage | KHALED | Confirm with Direction |
| Courier API / live tracking | LATER | If Direction offers an API |

## F. Admin dashboard
| Need | Status | Notes |
|---|---|---|
| Secure login with 2FA, roles, audit log | P5 | |
| Today view, orders list, order page, status changes | P5 | |
| Products, stock, photos, prices | P5 | |
| Shipping zones, discount codes, customers, blocklist | P5 | |
| Content and policy editing | P5 | |
| Manual order entry for DM orders | P5 | |
| Sales analytics and profit view | LATER | |

## G. Security
| Need | Status | Notes |
|---|---|---|
| Security headers (HSTS, frame, sniffing, referrer, permissions) | DONE | `next.config.ts` |
| Server-side validation of every checkout field | DONE | |
| Content Security Policy | P6 | |
| Rate limiting | DONE | Postgres counters (`rate_limits`), checkout + order lookup |
| Admin 2FA and audit log | P5 | |
| Daily encrypted database backup, restore proven on every run | DONE | `db-backup.yml`; first backup Oct 7 |
| Error monitoring (Sentry) | P6 | |

## H. Performance, SEO, accessibility
| Need | Status | Notes |
|---|---|---|
| Static pages, optimized images (AVIF/WebP), self-hosted fonts | DONE | |
| Product structured data, sitemap, robots, page titles | DONE | |
| Keyboard, screen reader, focus, reduced motion | DONE | Full audit in P6 |
| Lighthouse measured on every push | DONE | Oct 7: Perf 92–97, A11y/Best practices/SEO 100, CLS 0. LCP ~3 s on simulated 4G (budget 2 s) — re-measure on the live CDN |
| Friendly error pages (page and whole-site) | DONE | `app/error.tsx`, `app/global-error.tsx` |
| Written test plan mapping every business case to a test | DONE | `docs/13-test-plan.md` |

## I. Marketing and analytics
| Need | Status | Notes |
|---|---|---|
| Share image for links | DONE | |
| Analytics + Meta Pixel / Conversions API | P6 | |
| Instagram link in bio, story links, "How to order" highlight | KHALED | At launch |
| Abandoned checkout follow-up | LATER | |

## J. Engineering and launch
| Need | Status | Notes |
|---|---|---|
| GitHub repo, CI (install, tests, build, typecheck) | DONE | |
| Vercel hosting with live link | DONE | nuriya-store.vercel.app |
| Lockfile committed | DONE | Next.js 16.4.0, React 19.3.0 |
| Database schema, migrations, seed, storefront reads from DB | DONE | `db/migrations`, `lib/store.ts`; 7 database tests in CI |
| Pages static, refreshed on data change (`refreshStorefront`, `POST /api/revalidate`) | DONE | Replaced 60 s ISR, which left prefetches hanging |
| Production database on Neon | DONE | Oct 7: project "nuriya-store", Frankfurt, Postgres 17, branches production + preview; live /api/health = connected, seeded. First encrypted backup restored and stored. |
| Preview deployments on a separate test database (Neon branch "preview") | DONE | Test orders never touch production |
| Server functions pinned to Frankfurt | DONE | `vercel.json` |
| Phone alerts for outages, failed backups, failed migrations | DONE | GitHub issue labelled "alert", auto-closes on recovery |
| Shop stays up if the database is down; checkout refuses calmly and keeps the typed fields | DONE | Pre-built pages + one retry for Neon wake-up; "Database-down drill" in the UI audit |
| Uptime check every 15 min, database every 6 h, email on failure | DONE | `uptime.yml`; set repo variable `SITE_URL` when the domain is live |
| Operations runbook (setup, backups, restore, rollback, outages) | DONE | `docs/14-operations.md` |
| Move Neon to Launch plan (7-day restore) when real orders start | KHALED | Free plan has a 6-hour restore window |
| Real-phone test, test orders, courier dry run | P7 | |
