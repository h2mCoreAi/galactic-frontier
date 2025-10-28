#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

info()    { echo "📋 $*"; }
success() { echo "✅ $*"; }
error()   { echo "❌ $*"; }
die()     { error "$*"; exit 1; }

SOURCE_BRANCH="dev"
TARGET_BRANCH="main"
MERGE_MODE="ff-only"   # ff-only | merge-commit

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]
  --source BRANCH     Source branch to merge from (default: dev)
  --target BRANCH     Target branch to merge into (default: main)
  --merge-commit      Use a merge commit (default: fast-forward only)
  -h, --help          Show help
EOF
}

while [[ ${1-} ]]; do
  case "$1" in
    --source) shift; SOURCE_BRANCH="${1-}" || true ;;
    --target) shift; TARGET_BRANCH="${1-}" || true ;;
    --merge-commit) MERGE_MODE="merge-commit" ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1" ;;
  esac
  shift || true
done

# Ensure we're in a git repo, cd to repo root
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_ROOT="$(git rev-parse --show-toplevel)"
  info "Changing to Git repo root: $GIT_ROOT"
  cd "$GIT_ROOT" || die "Could not change to git root"
else
  die "Not inside a Git repository."
fi

# Ensure origin exists
git remote get-url origin >/dev/null 2>&1 || die "No 'origin' remote configured."

# Ensure branches exist locally; create from origin if missing
ensure_branch() {
  local branch="$1"
  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    info "Creating local branch '$branch' from origin/$branch"
    git fetch origin "$branch"
    git checkout -b "$branch" --track "origin/$branch" || die "Branch '$branch' not found on origin"
  fi
}

ensure_branch "$SOURCE_BRANCH"
ensure_branch "$TARGET_BRANCH"

# Update from origin
info "Fetching origin/$SOURCE_BRANCH and origin/$TARGET_BRANCH"
git fetch origin "$SOURCE_BRANCH" "$TARGET_BRANCH"

# Checkout target and rebase with origin
info "Checking out $TARGET_BRANCH and pulling latest"
git checkout "$TARGET_BRANCH"
git pull --rebase origin "$TARGET_BRANCH"

# Merge source into target
info "Merging $SOURCE_BRANCH into $TARGET_BRANCH (mode: $MERGE_MODE)"
if [ "$MERGE_MODE" = "ff-only" ]; then
  git merge --ff-only "$SOURCE_BRANCH" || die "Fast-forward merge failed. Re-run with --merge-commit or resolve conflicts."
else
  git merge --no-ff --no-edit "$SOURCE_BRANCH"
fi
success "Merge completed"

# Push target
info "Pushing $TARGET_BRANCH to origin"
git push origin "$TARGET_BRANCH"
success "Pushed $TARGET_BRANCH"

# Return to source
info "Switching back to $SOURCE_BRANCH"
git checkout "$SOURCE_BRANCH"
success "Done"

echo ""
echo "🎉 Promotion completed: $SOURCE_BRANCH → $TARGET_BRANCH"
echo "You can now pull '$TARGET_BRANCH' on your server."


