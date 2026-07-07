#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:5173}"
API_URL="${API_URL:-http://localhost:4000}"
TITLE="Browser smoke task $(date +%s)"
DESCRIPTION="Created with agent-browser"

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser is required. Install with: npm install -g agent-browser" >&2
  exit 1
fi

curl -fsS "$API_URL/health" >/dev/null
curl -fsS "$APP_URL" >/dev/null

agent-browser open "$APP_URL" >/dev/null
agent-browser fill "input" "$TITLE" >/dev/null
agent-browser fill "textarea" "$DESCRIPTION" >/dev/null
agent-browser click "button[type=submit]" >/dev/null

for _ in {1..20}; do
  if agent-browser get text body | grep -F "$TITLE" >/dev/null; then
    echo "Browser smoke passed: $TITLE"
    exit 0
  fi
  sleep 1
done

echo "Browser smoke failed: task title did not appear" >&2
agent-browser snapshot -i >&2 || true
exit 1
