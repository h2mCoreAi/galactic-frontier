#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

if [ -z "$(git rev-parse --is-inside-work-tree 2>/dev/null || true)" ]; then
  echo "❌ Not inside a Git repository" >&2
  exit 1
fi

if [ -z "$(git diff --staged --name-only)" ]; then
  echo "❌ No staged changes. Run: git add <files>" >&2
  exit 1
fi

# Collect staged files
FILES=( $(git diff --staged --name-only) )

# Heuristic: choose type and scopes from files
TYPE="feat"
SCOPES=()

has_ext() { [[ "$1" =~ \.$2$ ]]; }
add_scope() { for s in "${SCOPES[@]}"; do [ "$s" = "$1" ] && return; done; SCOPES+=("$1"); }

only_docs=true
only_config=true

for f in "${FILES[@]}"; do
  case "$f" in
    docs/*|README.md)
      add_scope docs ;;
  esac
  case "$f" in
    single-player/*|vite.config.*)
      add_scope frontend ;;
    server.js|backend/*)
      add_scope backend ;;
    config/*)
      add_scope config ;;
    devScripts/*|package*.json|ecosystem.*.config.js)
      add_scope build ;;
  esac

  if ! [[ "$f" =~ ^docs/ || "$f" =~ \\.md$ ]]; then
    only_docs=false
  fi
  if ! [[ "$f" =~ ^config/ || "$f" =~ \\.json$ ]]; then
    only_config=false
  fi
done

if [ "$only_docs" = true ]; then
  TYPE="docs"
elif [ "$only_config" = true ]; then
  TYPE="chore"
fi

# Build short files summary
SUMMARY=$(printf "%s, " "${FILES[@]:0:3}")
SUMMARY=${SUMMARY%, }
[ ${#FILES[@]} -gt 3 ] && SUMMARY+=" (+$(( ${#FILES[@]} - 3 )) more)"

SCOPE=""
if [ ${#SCOPES[@]} -gt 0 ]; then
  SCOPE="(${SCOPES[*]// /,})"
fi

MESSAGE="$TYPE$SCOPE: update ${#FILES[@]} files: $SUMMARY"

# Trim to ~72 chars
if [ ${#MESSAGE} -gt 72 ]; then
  MESSAGE="${MESSAGE:0:69}..."
fi

echo "📝 $MESSAGE"
git commit -m "$MESSAGE"
echo "✅ Commit created."


