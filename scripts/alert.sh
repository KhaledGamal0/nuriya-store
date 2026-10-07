#!/usr/bin/env bash
# Opens (or updates) a GitHub issue labelled "alert" so the GitHub app pings Khaled's phone,
# and closes it again once things recover. Needs GH_TOKEN with issues: write.
#   scripts/alert.sh open  "Shop is down" "details…"
#   scripts/alert.sh close "Shop is down" "Back to normal."
set -u
action="$1"; title="$2"; body="${3:-}"
run="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
gh label create alert --color B60205 --description "Automatic alert from a workflow" >/dev/null 2>&1 || true
num=$(gh issue list --label alert --state open --search "in:title \"$title\"" --json number,title -q ".[] | select(.title == \"$title\") | .number" | head -1)
if [ "$action" = "open" ]; then
  if [ -n "$num" ]; then
    gh issue comment "$num" --body "Still failing. $body — $run" >/dev/null
  else
    gh issue create --label alert --title "$title" --body "$body

Run: $run
This closes by itself when the next check passes. What to do: docs/14-operations.md → If something is down." >/dev/null
  fi
elif [ -n "$num" ]; then
  gh issue close "$num" --comment "${body:-Back to normal.} — $run" >/dev/null
fi
