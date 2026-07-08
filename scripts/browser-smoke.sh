#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:5173}"
API_URL="${API_URL:-http://localhost:4000}"
TITLE="Browser smoke task $(date +%s)"
DESCRIPTION="Created with agent-browser"
BUTTON_UPDATED_TITLE="$TITLE button updated"
BUTTON_UPDATED_DESCRIPTION="Updated with Save button"
BUTTON_UPDATED_TAG="button-verified"
UPDATED_TITLE="$TITLE updated"
UPDATED_DESCRIPTION="Updated with Enter key"
TAG="smoke"
UPDATED_TAG="verified"

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser is required. Install with: npm install -g agent-browser" >&2
  exit 1
fi

curl -fsS --max-time 10 "$API_URL/health" >/dev/null
curl -fsS --max-time 10 "$APP_URL" >/dev/null

agent-browser close --all >/dev/null 2>&1 || true

for _ in {1..5}; do
  agent-browser open "$APP_URL" >/dev/null || true
  if agent-browser get title | grep -F "Porkpie" >/dev/null; then
    break
  fi
  sleep 1
done

if ! agent-browser get title | grep -F "Porkpie" >/dev/null; then
  echo "Browser smoke failed: app did not open" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

if ! agent-browser eval "document.activeElement?.getAttribute('placeholder') === 'Buy milk'" | grep -F "true" >/dev/null; then
  echo "Browser smoke failed: title input did not receive initial focus" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

agent-browser fill "input[placeholder='Buy milk']" "$TITLE" >/dev/null
agent-browser fill "form textarea[placeholder='Optional details']" "$DESCRIPTION" >/dev/null
agent-browser fill "form input[placeholder='shopping, grocery']" "$TAG" >/dev/null
agent-browser click "button[type=submit]" >/dev/null

for _ in {1..20}; do
  page_text="$(agent-browser get text body)"
  if grep -F "$TITLE" <<<"$page_text" >/dev/null && grep -F "$TAG" <<<"$page_text" >/dev/null; then
    break
  fi
  sleep 1
done

page_text="$(agent-browser get text body)"
if ! grep -F "$TITLE" <<<"$page_text" >/dev/null || ! grep -F "$TAG" <<<"$page_text" >/dev/null; then
  echo "Browser smoke failed: created task title/tag did not appear" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

agent-browser click ".task-card:first-of-type .task-actions button" >/dev/null
if agent-browser eval "location.pathname !== '/'" | grep -F "true" >/dev/null; then
  :
else
  echo "Browser smoke failed: edit form did not update URL path" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi
agent-browser fill ".task-card:first-of-type .edit-fields input:first-of-type" "Cancel button should not persist" >/dev/null
agent-browser click ".task-card:first-of-type .task-actions button:nth-of-type(2)" >/dev/null

if ! agent-browser eval "location.pathname === '/'" | grep -F "true" >/dev/null; then
  echo "Browser smoke failed: Cancel button did not clear edit URL path" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

page_text="$(agent-browser get text body)"
if grep -F "Cancel button should not persist" <<<"$page_text" >/dev/null || ! grep -F "$TITLE" <<<"$page_text" >/dev/null; then
  echo "Browser smoke failed: Cancel button did not preserve original task" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

agent-browser click ".task-card:first-of-type .task-actions button" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields input:first-of-type" "Escape should not persist" >/dev/null
agent-browser press Escape >/dev/null

page_text="$(agent-browser get text body)"
if grep -F "Escape should not persist" <<<"$page_text" >/dev/null || ! grep -F "$TITLE" <<<"$page_text" >/dev/null; then
  echo "Browser smoke failed: Escape did not cancel edit and preserve original task" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

agent-browser click ".task-card:first-of-type .task-actions button" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields input:first-of-type" "$BUTTON_UPDATED_TITLE" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields textarea" "$BUTTON_UPDATED_DESCRIPTION" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields input[placeholder='Tags']" "$BUTTON_UPDATED_TAG" >/dev/null
agent-browser click ".task-card:first-of-type .task-actions button" >/dev/null

for _ in {1..20}; do
  page_text="$(agent-browser get text body)"
  if grep -F "$BUTTON_UPDATED_TITLE" <<<"$page_text" >/dev/null && \
    grep -F "$BUTTON_UPDATED_DESCRIPTION" <<<"$page_text" >/dev/null && \
    grep -F "$BUTTON_UPDATED_TAG" <<<"$page_text" >/dev/null; then
    break
  fi
  sleep 1
done

page_text="$(agent-browser get text body)"
if ! grep -F "$BUTTON_UPDATED_TITLE" <<<"$page_text" >/dev/null || \
  ! grep -F "$BUTTON_UPDATED_DESCRIPTION" <<<"$page_text" >/dev/null || \
  ! grep -F "$BUTTON_UPDATED_TAG" <<<"$page_text" >/dev/null; then
  echo "Browser smoke failed: Save button did not persist edited title/details/tag" >&2
  agent-browser snapshot -i >&2 || true
  exit 1
fi

agent-browser click ".task-card:first-of-type .task-actions button" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields input:first-of-type" "$UPDATED_TITLE" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields textarea" "$UPDATED_DESCRIPTION" >/dev/null
agent-browser fill ".task-card:first-of-type .edit-fields input[placeholder='Tags']" "$UPDATED_TAG" >/dev/null
agent-browser press Enter >/dev/null

for _ in {1..20}; do
  page_text="$(agent-browser get text body)"
  if grep -F "$UPDATED_TITLE" <<<"$page_text" >/dev/null && \
    grep -F "$UPDATED_DESCRIPTION" <<<"$page_text" >/dev/null && \
    grep -F "$UPDATED_TAG" <<<"$page_text" >/dev/null; then
    agent-browser click ".task-card:first-of-type .tags button" >/dev/null
    agent-browser fill "input[placeholder='Search tasks']" "$UPDATED_TITLE" >/dev/null
    agent-browser click ".switch-field input" >/dev/null
    sleep 1
    if agent-browser eval "document.querySelector('input[placeholder=\\'Filter by tag\\']')?.value" | grep -F "$UPDATED_TAG" >/dev/null && \
      agent-browser eval "new URLSearchParams(location.search).get('tag')" | grep -F "$UPDATED_TAG" >/dev/null && \
      agent-browser eval "new URLSearchParams(location.search).get('search')" | grep -F "$UPDATED_TITLE" >/dev/null && \
      agent-browser eval "new URLSearchParams(location.search).get('showCompleted')" | grep -F "true" >/dev/null; then
      echo "Browser smoke passed: $UPDATED_TITLE"
      exit 0
    fi
  fi
  sleep 1
done

echo "Browser smoke failed: edited title/details/tag did not appear or tag click did not filter" >&2
agent-browser snapshot -i >&2 || true
exit 1
