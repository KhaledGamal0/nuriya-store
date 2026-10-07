# Nuriya Store — project home

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # checkout and pricing rules
npm run build
```

Custom e-commerce website + admin dashboard for **Nuriya** (Cairo women's clothing, @nuriya.eg).
Owner: Khaled Gamal. Live: https://nuriya-store.vercel.app. Status and next steps: `docs/11-tracker.md`.

## Environment
See `.env.example`. Production database: Neon (set `DATABASE_URL` in Vercel and as a GitHub secret, then run the **Database deploy** workflow with "seed").

## Read in this order
| File | What it holds |
|---|---|
| `docs/01-brand.md` | Brand bible condensed from the 17-page brand book (identity, colors, type, voice, product, photo rules) |
| `docs/02-decisions.md` | Every decision Khaled has confirmed + what is still open |
| `docs/03-shipping.md` | Direction courier price list (all governorates) + courier terms |
| `docs/04-policies.md` | Return & exchange policy EN/AR (exact approved wording) |
| `docs/05-architecture.md` | Stack, performance budget, payments flow (Paymob + COD), security |
| `docs/06-admin-dashboard.md` | Admin dashboard scope — v1 and later |
| `docs/07-roadmap.md` | Phases: now → launch → after launch |
| `docs/08-design-direction.md` | The unique, non-template design direction for the storefront |
| `docs/09-review-samples-and-stack.md` | Review of saved UI samples + friend prompt, and final stack verdict |
| `docs/10-build-plan.md` | Phases, tasks, acceptance checklists, progress log |
| `docs/11-tracker.md` | Master tracker: every business need and its status |
| `docs/12-ui-standards.md` | UI rules applied to every screen |
| `docs/13-test-plan.md` | Every business case and the automated test that covers it |
| `CLAUDE.md` | The project brain — Claude Code reads it automatically every session |
| `data/shipping-zones.json` | Shipping fees as seed data for the database |

## Assets (`brand-assets/`)
- `kit/` — official brand kit: **SVG logos (use on site)**, favicons, colors css/json, type specimen, print pieces, OG image, hero banner, styling boards (HD)
- `photos-raw/` — WhatsApp-compressed product/model/label photos (≤1280 px — NOT launch quality)
- `instagram-screens/` — 9 screenshots of the feed, posts, stories (shows content style + view counts)
- `photos-instagram/` — 18 full-resolution screenshots of real model photos (source of the site's model photos, cropped clean)
- `reference/` — brand book PDF, courier price list, return policy screen
