# 14 — Running the shop: hosting, database, backups, outages

The store is small: about 1 product, 4 sizes, 35 delivery areas and, at first, tens of orders a day. A database this size fits easily in Neon's free 1 GB. The aim is **simple and boring**: few moving parts, everything in one region, automatic checks, and a tested way back after any mistake.

## Setup (once)
| Where | What | Notes |
|---|---|---|
| Neon | Project `nuriya`, Postgres 17, region **AWS Europe Central 1 (Frankfurt)** | Region can't be changed later. Frankfurt is the closest Neon region to Cairo. |
| Vercel → Settings → Functions | Function region **fra1 (Frankfurt)** | Server code sits next to the database; each query takes about 1 ms instead of about 100 ms across the Atlantic. |
| Vercel → Environment variables (Production + Preview) | `DATABASE_URL` = Neon **pooled** string (host contains `-pooler`), `REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL` | Pooled, because serverless functions open many short connections. |
| GitHub → Settings → Secrets → Actions | `DATABASE_URL` = Neon **direct** string, `BACKUP_PASSPHRASE` | Direct, because migrations and pg_dump need a real session. |
| GitHub → Settings → Variables → Actions | `SITE_URL` = live address | Used by the uptime check. Change it when the domain is connected. |
| GitHub → Actions → Database deploy → Run (tick "seed") | Creates the tables and starting data | Safe to repeat. |

Secrets are never pasted into chat, code, issues or screenshots. If one leaks: reset the password in Neon (Roles → Reset), update Vercel and GitHub, then redeploy.

## Why the shop stays up when the database is down
- **Shop pages are pre-built** (home, product, size guide, returns, checkout page). Vercel serves them from its CDN without touching the database, so customers can still browse during a database outage.
- **A failed refresh keeps the last good page.** If the database is unreachable during a refresh, Next.js keeps serving the previous version.
- **A failed build never replaces the live site.** Vercel keeps the last working deployment live.
- **Neon sleeps after 5 idle minutes** (free plan; this can't be turned off) and wakes on the next query in well under a second. Every database read retries once (`lib/store.ts`), so a customer never sees the wake-up.
- **Checkout fails safely.** If the database still can't be reached, the customer sees "We couldn't place your order just now. Nothing was charged…" and keeps everything they typed. The site never falls back to built-in prices for a real order.
- **This is tested on every push:** the UI audit restarts the site against a dead database and checks all of the above (the "Database-down drill" in `report.md`).

## Automatic checks
| Workflow | When | What fails it |
|---|---|---|
| CI | every push | Tests, database tests, build or type errors |
| UI audit | every push | Any page, flow, accessibility, speed or database-down finding |
| Database deploy | when a migration is pushed | A migration that doesn't apply |
| **Uptime check** | every 15 min (pages), every 6 h (database) | A page that isn't 200, or `/api/health` not ok |
| **Database backup** | daily 03:30 Cairo | A dump that can't be made **or can't be restored** |

A failed run sends an email to Khaled. Check that GitHub → Settings → Notifications → Actions is set to email you for failed workflows. GitHub pauses scheduled workflows on a public repo after 60 days with no commits; a push or "Enable workflow" turns them back on.

## Backups: two layers
1. **Neon restore window:** rewind the database to any second inside the window (6 hours on Free, up to 7 days on the Launch plan). Use it for mistakes noticed quickly, like a bad edit or a wrong migration. Neon → Branches → Restore. Restoring into a new branch first lets you look before replacing anything.
2. **Daily encrypted copy** (GitHub artifact, 30 days). Use it for anything older than the restore window. The copy is encrypted because the repository is public and orders hold customer phones and addresses. Steps to open it are in `.github/workflows/db-backup.yml`. **Keep `BACKUP_PASSPHRASE` in your password manager; without it the backups are unreadable.**

Once real orders are coming in, move to Neon **Launch** (pay per use, likely a few dollars a month at this size) for the 7-day restore window.

## Changing the database safely
- Schema changes only through a new `db/migrations/000N_*.sql` file. CI checks it against a real Postgres, then the Database deploy workflow applies it. Never edit tables by hand in the Neon console.
- Migrations only add (new tables or columns, nullable or with a default). Dropping or renaming happens in a later release, after the code stops using the old name.
- Before a risky migration, create a Neon branch (an instant copy) and run the workflow against it first.

## If something is down
| Symptom | First check | Fix |
|---|---|---|
| Uptime email: page not 200 | vercel.com/status, latest deployment | Vercel → Deployments → previous good one → **Promote** (instant rollback) |
| `/api/health` says `database: error` | neon.tech/status, Neon project → Monitoring | Usually recovers by itself; browsing keeps working. If the free 100 compute-hours are used up: upgrade to Launch. |
| Wrong data after an edit | Which rows, since when | Neon restore to just before the edit (into a branch, check, then swap) |
| Secret leaked | — | Reset in Neon, update Vercel and GitHub, redeploy |

## Later (with Phase 6)
Sentry error alerts, CSP, and a status line in the admin dashboard showing the last backup and uptime result.
