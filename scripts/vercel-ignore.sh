#!/usr/bin/env bash
# Vercel "Ignored Build Step": exit 0 = skip this deployment, exit 1 = build it.
# Skips only when NOTHING the website uses changed since the last version that actually went live
# (VERCEL_GIT_PREVIOUS_SHA), so changes held back by an earlier skipped or rate-limited push still ship.
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  git fetch -q --deepen=50 2>/dev/null || true
fi
if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo "No previous deployment to compare with: build."; exit 1
fi
if git diff --quiet "$base" HEAD -- . \
  ':(exclude)docs' ':(exclude)*.md' ':(exclude)tests' ':(exclude).github' \
  ':(exclude)scripts/ui-audit.mjs' ':(exclude)scripts/outage-check.mjs' ':(exclude)scripts/lighthouse.mjs' \
  ':(exclude)scripts/neon.mjs' ':(exclude)scripts/vercel.mjs' ':(exclude)scripts/alert.sh' ':(exclude)scripts/vercel-ignore.sh'; then
  echo "Only docs, tests or automation changed since the live version: skip."; exit 0
fi
echo "Website files changed: build."; exit 1
