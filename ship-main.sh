#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

info()    { echo "📋 $*"; }
success() { echo "✅ $*"; }
error()   { echo "❌ $*"; }
die()     { error "$*"; exit 1; }

# Go to git repo root
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

ensure_branch dev
ensure_branch main

# Fetch and update
info "Fetching origin/dev and origin/main"
git fetch origin dev main

# Ensure we're on dev, update, and commit (smart)
info "Checking out dev"
git checkout dev

info "Staging all changes on dev"
git add .

if git diff --staged --quiet; then
  info "No staged changes to commit on dev"
else
  if [ -x "devScripts/commit-smart.sh" ]; then
    info "Committing staged changes with commit-smart.sh"
    ./devScripts/commit-smart.sh
  else
    info "commit-smart.sh not executable or missing; committing with generic message"
    git commit -m "chore: update"
  fi
fi

info "Pulling latest dev with rebase (autostash)"
git pull --rebase --autostash origin dev

info "Pushing dev to origin"
git push origin dev

# Checkout main and pull latest
info "Checking out main and pulling latest"
git checkout main
git pull --rebase origin main

# Merge dev into main using a merge commit (simple default)
info "Merging dev into main (merge commit)"
git merge --no-ff --no-edit dev
success "Merge completed"

# Push main
info "Pushing main to origin"
git push origin main
success "Pushed main"

# Return to dev
info "Switching back to dev"
git checkout dev
success "Done"

echo ""
echo "🎉 main is updated from dev and pushed to GitHub."
echo "You can now pull 'main' on your server."


