#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq is required. Install: sudo apt-get install -y jq" >&2
  exit 1
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "❌ Set OPENAI_API_KEY in your environment." >&2
  echo "   export OPENAI_API_KEY=sk-..." >&2
  exit 1
fi

if [ -z "$(git diff --staged)" ]; then
  echo "❌ No staged changes. Run: git add <files>" >&2
  exit 1
fi

# Limit diff size to keep request small
DIFF=$(git diff --staged --patch --unified=0 --minimal | head -c 60000)

read -r -d '' PROMPT << 'EOF'
You are an assistant that writes concise Conventional Commits based on the staged diff.
Rules:
- Single-line summary only; no code blocks or extra prose.
- Use types: feat, fix, chore, refactor, docs, test, build, ci.
- Add a short scope when obvious (e.g., frontend, backend, config).
- Be specific (what changed, why if clear), keep it under ~72 chars.
EOF

JSON=$(jq -n --arg sys "$PROMPT" --arg diff "$DIFF" '{
  model: "gpt-4o-mini",
  temperature: 0.2,
  messages: [
    {role:"system", content:$sys},
    {role:"user", content:("Generate a commit message for this diff:\n" + $diff)}
  ]
}')

RESP=$(curl -sS https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$JSON")

MSG=$(echo "$RESP" | jq -r '.choices[0].message.content' | sed -e 's/^\s*//;s/\s*$//')

if [ -z "$MSG" ] || [ "$MSG" = "null" ]; then
  echo "❌ AI returned empty message" >&2
  echo "$RESP" | jq . >&2 || true
  exit 1
fi

echo "📝 $MSG"
git commit -m "$MSG"
echo "✅ Commit created."


