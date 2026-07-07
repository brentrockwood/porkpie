#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:5173}"
API_URL="${API_URL:-http://localhost:4000}"
TITLE="Browser smoke task $(date +%s)"
DESCRIPTION="Created with agent-browser"
UPDATED_TITLE="$TITLE updated"
UPDATED_DESCRIPTION="Updated with agent-browser"

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser is required. Install with: npm install -g agent-browser" >&2
  exit 1
fi

curl -fsS "$API_URL/health" >/dev/null
curl -fsS "$APP_URL" >/dev/null

agent-browser close --all >/dev/null 2>&1 || true
agent-browser open "$APP_URL" >/dev/null

if ! agent-browser eval "document.activeElement?.getAttribute('placeholder') === 'Buy milk'" | grep -F "true" >/dev/null; then
  echo "Browser smoke failed: title input did not receive initial focus" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

agent-browser fill "input[placeholder='Buy milk']" "$TITLE" >/dev/null
agent-browser fill "form textarea[placeholder='Optional details']" "$DESCRIPTION" >/dev/null
agent-browser click "button[type=submit]" >/dev/null

for _ in {1..20}; do
  if agent-browser get text body | grep -F "$TITLE" >/dev/null; then
    break
  fi
  sleep 1
done

if ! agent-browser get text body | grep -F "$TITLE" >/dev/null; then
  echo "Browser smoke failed: task title did not appear" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

agent-browser click ".task-card:first-of-type .task-actions button" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields input" "$UPDATED_TITLE" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields textarea" "$UPDATED_DESCRIPTION" >/dev/null
agent-browser click ".task-card:first-of-type .task-actions button" >/dev/null

for _ in {1..20}; do
  page_text="$(agent-browser get text body)"
  if grep -F "$UPDATED_TITLE" <<<"$page_text" >/dev/null && grep -F "$UPDATED_DESCRIPTION" <<<"$page_text" >/dev/null; then
    echo "Browser smoke passed: $UPDATED_TITLE"
    exit 0
  fi
  sleep 1
done

echo "Browser smoke failed: edited title/details did not appear" >&2
agent-browser snapshot -i >&2 || true
exit 1
