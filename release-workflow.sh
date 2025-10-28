#!/bin/bash

# Galactic Frontier Release Workflow Script
# Commits to dev (if changes), builds, pushes dev, merges to main, pushes main, returns to dev

set -euo pipefail
IFS=$'\n\t'

echo "🚀 Galactic Frontier Release Workflow"
echo "===================================="

# ------------ helpers ------------
info()    { echo "📋 $*"; }
success() { echo "✅ $*"; }
error()   { echo "❌ $*"; }
die()     { error "$*"; exit 1; }

# Default options (can be overridden by flags)
COMMIT_MESSAGE=""
SKIP_BUILD=false
MERGE_MODE="ff-only"   # ff-only | merge-commit
CREATE_TAG=false
PROMOTE_ONLY=false
SOURCE_BRANCH="dev"
TARGET_BRANCH="main"

parse_args() {
  while [[ ${1-} ]]; do
    case "$1" in
      -m|--message)
        shift; COMMIT_MESSAGE="${1-}" || true ;;
      --skip-build)
        SKIP_BUILD=true ;;
      --merge-commit)
        MERGE_MODE="merge-commit" ;;
      --tag)
        CREATE_TAG=true ;;
      --promote-only)
        PROMOTE_ONLY=true ;;
      --source)
        shift; SOURCE_BRANCH="${1-}" || true ;;
      --target)
        shift; TARGET_BRANCH="${1-}" || true ;;
      -h|--help)
        cat <<EOF
Usage: $(basename "$0") [options]
  -m, --message "msg"   Commit message to use if there are changes
      --skip-build      Skip npm ci && npm run build
      --merge-commit    Use a merge commit into main (default: ff-only)
      --tag             Create and push an annotated release tag
      --promote-only    Only merge SOURCE into TARGET and push TARGET (no commit/build/push dev)
      --source BRANCH   Source branch to merge from (default: dev)
      --target BRANCH   Target branch to merge into (default: main)
      -h, --help        Show this help
EOF
        exit 0 ;;
      *)
        die "Unknown option: $1" ;;
    esac
    shift || true
  done
}

has_uncommitted_changes() { test -n "$(git status --porcelain)"; }

ensure_branch_exists() {
  local branch="$1"
  git show-ref --verify --quiet "refs/heads/$branch" || die "Branch '$branch' does not exist."
}

ensure_remote() {
  git remote get-url origin >/dev/null 2>&1 || die "No 'origin' remote configured."
}

pull_rebase() {
  local branch="$1"
  git fetch origin "$branch"
  git checkout "$branch"
  git pull --rebase origin "$branch"
}

run_build() {
  if [ "$SKIP_BUILD" = true ]; then
    info "Skipping build as requested"
    return 0
  fi
  info "Installing dependencies (npm ci)"
  npm ci
  info "Building (npm run build)"
  npm run build
  success "Build completed"
}

get_commit_message() {
  if [ -n "$COMMIT_MESSAGE" ]; then
    echo "$COMMIT_MESSAGE"
    return 0
  fi
  echo "📝 Enter your commit message:"
  echo "(Press Enter when done)"
  read -r msg
  if [ -z "$msg" ]; then
    die "Commit message cannot be empty"
  fi
  echo "$msg"
}

# Function to execute git commands with error handling
execute_git_command() {
    local cmd="$1"
    local description="$2"

    echo "📋 $description..."
    if eval "$cmd"; then
        echo "✅ $description - Success"
    else
        echo "❌ $description - Failed"
        exit 1
    fi
    echo ""
}

# Main workflow
main() {
  parse_args "$@"

  # Ensure we're in the repository root (relative to script), but verify with git
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR/.." || die "Could not change to project root directory"
  # Resolve actual git root to avoid accidental /srv due to wrong cwd
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    GIT_ROOT="$(git rev-parse --show-toplevel)"
    info "Changing to Git repo root: $GIT_ROOT"
    cd "$GIT_ROOT" || die "Could not change to git root directory"
  else
    die "Not inside a Git repository."
  fi

  # Initial checks
  info "Checking current status..."
  ensure_remote
  ensure_branch_exists "$SOURCE_BRANCH"
  ensure_branch_exists "$TARGET_BRANCH"

  if [ "$PROMOTE_ONLY" = false ]; then
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$SOURCE_BRANCH" ]; then
      die "You are not on the '$SOURCE_BRANCH' branch. Current: $current_branch (hint: git checkout $SOURCE_BRANCH)"
    fi

    # Update source with latest and ensure a clean rebase
    pull_rebase "$SOURCE_BRANCH"

    # Commit if there are changes
    if has_uncommitted_changes; then
      msg=$(get_commit_message)
      info "Staging and committing changes to $SOURCE_BRANCH"
      git add .
      git commit -m "$msg"
      success "Committed changes"
    else
      info "No local changes to commit on $SOURCE_BRANCH — continuing"
    fi

    # Build before pushing
    run_build

    # Push source
    info "Pushing $SOURCE_BRANCH to origin"
    git push origin "$SOURCE_BRANCH"
    success "Pushed $SOURCE_BRANCH"
  else
    info "Promote-only mode: skipping commit/build/push of $SOURCE_BRANCH"
  fi

  # Prepare main, pull latest
  pull_rebase "$TARGET_BRANCH"

  # Merge dev into main
  info "Merging $SOURCE_BRANCH into $TARGET_BRANCH using mode: $MERGE_MODE"
  if [ "$MERGE_MODE" = "ff-only" ]; then
    git merge --ff-only "$SOURCE_BRANCH" || die "Fast-forward merge failed. Consider running with --merge-commit or resolve conflicts."
  else
    git merge --no-ff --no-edit "$SOURCE_BRANCH"
  fi
  success "Merge completed"

  # Optional tag
  if [ "$CREATE_TAG" = true ]; then
    ts=$(date +"%Y%m%d-%H%M")
    tag="release-${ts}"
    info "Creating annotated tag: $tag"
    git tag -a "$tag" -m "Release $tag"
  fi

  # Push main (+ tags if created)
  info "Pushing $TARGET_BRANCH to origin"
  if [ "$CREATE_TAG" = true ]; then
    git push origin "$TARGET_BRANCH" --tags
  else
    git push origin "$TARGET_BRANCH"
  fi
  success "Pushed $TARGET_BRANCH"

  # Return to dev
  info "Switching back to $SOURCE_BRANCH"
  git checkout "$SOURCE_BRANCH"
  success "Done"

  echo ""
  echo "🎉 Release workflow completed successfully!"
  echo "=========================================="
  echo "📊 Summary:"
  echo "   • Dev updated (rebase), committed if changes, built"
  echo "   • Dev pushed to origin"
  echo "   • Main updated (rebase), merged from dev ($MERGE_MODE)"
  echo "   • Main pushed to origin${CREATE_TAG:+ (with tag)}"
  echo "   • Switched back to dev"
  echo ""
  echo "🚀 Production server will auto-deploy via deploy.sh"
  echo "🌐 Game available at: galacticfrontier.h2mcore.ai"
  echo ""
  echo "Happy coding! 🎮✨"
}

# Run main function
main "$@"
