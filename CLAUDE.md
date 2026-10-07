# CLAUDE.md — Nuriya Store (read fully at the start of EVERY session)

You are building the custom e-commerce website + admin dashboard for **Nuriya**, a Cairo women's clothing brand (@nuriya.eg). Owner: **Khaled Gamal** — software lead engineer (frontend, Oracle SQL, payments, security), so explain technical choices plainly but don't oversimplify.

## Source of truth (read before any work)
1. `docs/01-brand.md` — brand bible (colors, type, voice, product, photo rules). Full brand book: `brand-assets/reference/Nuriya-Brand-Book.pdf`
2. `docs/02-decisions.md` — confirmed decisions + open questions. **Never decide an open question silently — ask Khaled.**
3. `docs/03-shipping.md` + `data/shipping-zones.json` — Direction courier fees
4. `docs/04-policies.md` — return policy EN/AR (exact wording)
5. `docs/05-architecture.md` — stack, performance budget, payment flow, security
6. `docs/06-admin-dashboard.md` — admin scope
7. `docs/08-design-direction.md` — the design concept; `docs/09-review-samples-and-stack.md` — what to avoid
8. `docs/10-build-plan.md` — **phases, tasks and acceptance checklists. Work only on the current phase.**
9. `docs/11-tracker.md` — **master tracker of every business need. Update it in the same commit as the work.**
11. `docs/13-test-plan.md` — **which test covers which business case. Add a test for every new rule.**
12. `docs/14-operations.md` — **hosting, Neon setup, backups, uptime, outage runbook.**
10. `docs/12-ui-standards.md` — **UI rules for every screen (one radius, no stray circles, hover only on mouse devices).**

## Non-negotiables
- **Logo:** always the SVG from `brand-assets/kit/01_Logo/svg/`. NEVER type "Nuriya" in a font.
- **Brand tokens only:** pink #FFE1ED, plum #3C0E18, soft plum #683A46, rose gold #B78074 (accent only — never prices, body text, buttons), burgundy #7A2B3C, cream #F3F0E8, tint #FFF0F6, hairline #E7C7D1, white. No pure black text. Fonts: Instrument Serif (headings, sentence case) + Poppins + IBM Plex Sans Arabic. No Inter, no default Tailwind palette, no UI kit look.
- **Approved look (Oct 7 2026, Khaled):** clean and simple, big-brand editorial. Mostly white, plum ink, pink only as a tiny accent. Full-bleed real photos. Few elements, one job per section, strict 8px spacing scale. Khaled rejected busy layouts: no extra tags, badges, marquees, trust rows or decorative props. Reference: `prototype/storefront-template.html`.
- **Not generic:** no star-rating grids, no three-icon trust rows, no promo popups, no gradient buttons, no heavy shadows, no stock photos, no lorem ipsum.
- **Mobile first** (390 px). Traffic comes from Instagram on phones over 4G.
- **Performance budget (measured by `scripts/lighthouse.mjs` on every push):** LCP < 2.0 s mobile 4G, CLS < 0.05, INP < 200 ms, total JS ≤ 180 KB transferred (React + Next.js alone are ~118 KB; keep our own code small), Lighthouse mobile ≥ 95. No entrance animations that start content invisible (they delay LCP). A change that breaks the budget is not done.
- **Money:** prices, shipping and discounts are computed ONLY on the server from the DB. Amounts stored as integer piasters. Never trust the client cart.
- **Payments:** Paymob Intention API + hosted Unified Checkout (card data never touches our server). Order becomes PAID only from a server webhook with verified HMAC + matching amount/currency/order id, processed idempotently. The browser return URL never marks paid. COD orders go to CONFIRMATION_NEEDED.
- **Guest checkout by phone.** No forced customer accounts.
- **Security:** Zod validation on every input, CSP + security headers, rate limits (checkout, login, coupons, order lookup), admin = Better Auth + TOTP 2FA + roles + audit log, secrets only in env vars, test/live keys separated.
- **Bilingual data model** (EN + AR fields) from day one; Arabic UI = real RTL.
- **Everything business-related editable in admin** (prices, stock, shipping fees, content, policy text).

## Running it
`npm ci` · `npm run dev` · `npm test` (business rules + database tests when `DATABASE_URL` is set) · `npm run db:migrate` · `npm run db:seed` · `npm run build` · `npm run typecheck`. CI (`.github/workflows/ci.yml`) starts a real Postgres and runs all of them on every push; its logs are on the `ci-logs` branch. Env vars: see `.env.example`.
- Photos: a changed photo always gets a NEW file name (prepared photos are cached 1 year). After adding photos run `python3 scripts/make-images.py && python3 scripts/make-blur.py` (every size made ahead of time + loading previews; a test fails if forgotten).
- Schema changes = a NEW file `db/migrations/000N_name.sql` (never edit an applied one) + matching `lib/db/schema.ts` columns. After any data change call `refreshStorefront()`.

## Stack
Next.js 16.x App Router + TypeScript (strict) · PostgreSQL (Neon) + Drizzle · Better Auth (admin) · Tailwind v4 with Nuriya tokens only (or CSS modules) · Paymob · image CDN (Cloudinary or R2 + transforms) · Resend · Vercel · Sentry · Vitest + Playwright.
Check current docs before using any API (Next.js, Paymob, Better Auth change often).

## How to work
- One phase at a time from `docs/10-build-plan.md`. Before coding a phase: restate its tasks, list anything missing from Khaled, then build.
- End of every phase: run tests, lint, typecheck, build, Lighthouse on mobile; tick the acceptance checklist in `docs/10-build-plan.md`; deploy a preview; give Khaled the preview link + what to check on his phone.
- Every push runs `.github/workflows/ui-audit.yml`: real browser on phone and desktop, screenshots, axe accessibility, tap targets, sideways scroll, console errors and the full buy flow. Read `report.md` and the screenshots on the `ui-report` branch (`git fetch origin ui-report`) and fix findings before calling work done.
- **"Live" means Vercel deployed it.** After a push, check the Vercel status on the commit (`gh api repos/{owner}/{repo}/commits/<sha>/statuses`) is success before telling Khaled it's live. CI and the UI audit passing is not the same as deployed.
- **Vercel Pro (since Oct 7): 6,000 deployments/day.** Every push to `main` deploys (no skip rule: it once skipped a real change). The `ci-logs` and `ui-report` branches never deploy (`vercel.json` + a `vercel.json` written into those branches).
- Update `docs/02-decisions.md` whenever Khaled decides something. Update `docs/10-build-plan.md` progress. Commit small, clear commits.
- Never invent product facts (fabric, care, stock). Use `TODO(khaled)` placeholders and list them.
- When Khaled sends existing files for a fix: give each change as **FROM / TO** blocks he can copy-replace, keep fixes small and don't affect screens that already work.
