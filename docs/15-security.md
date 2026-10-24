# Security checklist (Khaled, Oct 25 2026) — check every item before calling a change done

| # | Item | How Nuriya does it | Where |
|---|---|---|---|
| 1 | Secrets never in code | `.env*` git-ignored (only `.env.example`); keys only in Vercel env / GitHub secrets, pasted by Khaled; full history scanned Oct 25 2026: clean (175 commits); GitHub secret scanning + push protection ON | `.gitignore`, GitHub settings |
| 2 | HTTPS only | Vercel certificate (auto-renew) + HSTS 2 years, preload; CSP `upgrade-insecure-requests` | `next.config.ts` |
| 3 | Validate every input on the server | checkout fields cleaned and checked; cart re-priced from the DB; API routes accept only known fields with length/range checks | `lib/checkout.ts`, `lib/meta-capi.ts` (`parseClientEvent`), `app/api/*` |
| 4 | Parameterized SQL | postgres.js tagged templates and Drizzle everywhere; no string-built SQL (only the migration runner executes our own files) | `lib/orders.ts`, `lib/store.ts` |
| 5 | Escape output | React escapes text; e-mails escape every value; JSON-LD escapes `<` | `lib/notify.ts`, product page |
| 6 | Rate limits | checkout per device + per phone (DB); Meta browser notes 60/min per device; token-only admin endpoints (one-time pass, 10 min, used once) | `lib/orders.ts`, `lib/ip-limit.ts`, `lib/one-time-token.ts` |
| 7 | Passwords | no customer accounts (guest checkout by phone). Admin today = GitHub account; future admin = Better Auth + TOTP 2FA | — |
| 8 | Bots | hidden honeypot field + rate limits (no captcha: it would cost sales) | checkout |
| 9 | CORS / other sites | no CORS headers (browsers block other sites); Meta notes accepted only from nuriya.app | `app/api/meta-event` |
| 10 | Security headers | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy — checked by `tests/security.test.ts` | `next.config.ts` |
| 11 | No directory listing | Vercel never lists folders | — |
| 12 | Dependencies up to date | Dependabot (weekly npm, monthly Actions) opens PRs; `npm audit` runs in CI | `.github/dependabot.yml`, `ci.yml` |
| 13 | Errors | customers see friendly messages; details only in server logs, never phones/addresses/keys | `app/error.tsx`, `console.*` calls |
| 14 | Accounts (Khaled) | 2-step verification ON for GitHub, Vercel, Neon, Meta, Resend, Gmail | Khaled's accounts |
| 15 | Data | encrypted daily backups (30 days); every admin change backs up first and writes an audit line | `admin-tasks.yml`, backup workflow |

Adding a new third-party script or domain = add it to the CSP in `next.config.ts`, or the browser will block it (the live check and the UI audit will show it).
