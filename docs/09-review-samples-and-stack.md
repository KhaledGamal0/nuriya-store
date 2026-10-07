# 09 — Review: Khaled's saved UI samples + friend's "best practice" prompt (Oct 7 2026)

Review only — nothing implemented. Sources: `brand-assets/reference/ui-samples/` (12 IG reel screenshots), `brand-assets/reference/friend-best-practice-prompt.md`.

## UI samples — what to take, what to leave
| Sample | What it is | Verdict for Nuriya |
|---|---|---|
| webstudio2370 ×3 (WEAR YOUR ENERGY / OWN THE STREET / STAND OUT) | AI-generated concept reels, streetwear, neon bg, giant condensed type, floating sticker tags | Take: giant condensed type as a design element, product cut-outs. Leave: loud colors, stickers — the opposite of "Not loud" |
| danvorastudio | Clothes hanging on a rail as the product gallery | Take the idea: a **rail/hanger** gallery — Nuriya already shoots on hangers |
| sujon.co "Glamour Grove" ×2 | Standard template: star ratings, Add to cart grid, lorem copy | **Avoid** — this is the generic look |
| flowbit "Seventh" | Shopify theme, model line-up on white | Take: editorial line-up of real girls, calm white space |
| websitedesigners.la "The Siren" | One model huge on off-white, tiny text | Closest to *quiet luxury*: one image, lots of air |
| developer.jot "Coffee" | Product hero + serif title | Clean but common — fine for a section, not identity |
| tegadesigns "$3000 site" | AI-built lookbook, color dots per look, "shop the look" | Take: **shop the look** + colorway dots |
| wixifystudio "Nourishing formula" ×2 | Soft pink, serif + script logo, petals, smooth motion | **Most relevant mood** — same pink/serif/script family as Nuriya |

Takeaways: luxury = restraint + photography + typography + motion quality, not effects. Many samples are AI concept videos at laptop size; Nuriya's buyers are on phones from Instagram, so every idea is judged on a 390 px phone first. Photography is the #1 lever → originals / shoot needed.

## Friend's prompt — verdict: good skeleton, generic + partly outdated
Keep: Next.js App Router, TypeScript, Zod validation, PostgreSQL, server actions, webhook signature verification, rate limiting, Resend, Vercel, accessibility checklist, ISR.

Fix / replace:
1. Next.js 14 → current **16.x** (16.3.8 stable, Sep 30 2026)
2. NextAuth v5 → **Better Auth** (Auth.js maintained by Better Auth team since Sep 22 2025; they recommend Better Auth for new projects). Only admins need login at launch
3. Forced customer accounts (Order requires userId) → **guest checkout by phone**; accounts optional later. Login walls kill COD conversion
4. Stripe → Stripe doesn't onboard Egypt-based merchants (as far as known) → **Paymob only** (+ COD)
5. Paymob flow written as legacy (auth → order → payment key → iframe) → current docs: **Intention API + Unified Checkout (hosted) or Pixel (embedded)**, webhook = source of truth, verify HMAC
6. Stripe sample uses `item.price` from the client cart → price tampering risk. Server must re-price from DB. Money as integer piasters, not JS floats
7. FID → replaced by **INP** (Mar 2024). Their LCP 2.5 s is "passing"; our target is < 2.0 s
8. Design tokens: Inter + generic brown 50–900 scale = the template look → Nuriya tokens (pink/plum/rose gold, condensed serif + Poppins + Plex Arabic)
9. Schema gaps: no shipping zones (flat 50 EGP), no stock reservation, no COD-confirm / refused-at-door statuses, no payment-callback table, no order event/audit log, no bilingual fields, no guest customers
10. Over-scoped for launch: categories tree, search, wishlist, reviews — one product, two colorways. Add later
11. Security gaps: no CSP, no admin 2FA, no audit log; prefer argon2id over bcrypt
12. "5–7 days, $1/month" unrealistic: Vercel Hobby plan is non-commercial → Pro needed for a store; free Supabase pauses when idle. Realistic: ~3–4 weeks to a quality launch, ~$25–50/month at start
13. Tailwind is fine (v4 is fast); the template look comes from defaults, not the tool. Allowed if all tokens are Nuriya's
