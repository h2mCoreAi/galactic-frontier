#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

info()    { echo "📋 $*"; }
success() { echo "✅ $*"; }
error()   { echo "❌ $*"; }
die()     { error "$*"; exit 1; }

echo "🚀 Galactic Frontier - Production Deploy"

# Resolve repo root (resilient to non-git directories)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT" || die "Cannot cd to repo root"
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  info "Repo root: $REPO_ROOT"
else
  info "Repo root (no git detected): $REPO_ROOT"
fi

# Update code
info "Pulling latest main"
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch origin main || true
  git checkout main || true
  git reset --hard origin/main || true
  success "Main is up to date"
else
  info "Skipping git pull (no git repo detected)"
fi

# Install deps
info "Installing dependencies (npm ci)"
if ! npm ci; then
  info "npm ci failed; falling back to npm install"
  npm install
fi

# Build frontend (vite.config outDir -> frontend/dist)
info "Building frontend"
npm run build
success "Build complete"

# Ensure dist points to frontend/dist for nginx
info "Linking dist -> frontend/dist"
mkdir -p frontend/dist
ln -sfn frontend/dist dist
test -f dist/index.html || die "dist/index.html missing after build"

# Quiet favicon.ico 404s by mirroring svg when present
if [ -f dist/favicon.svg ]; then
  cp -f dist/favicon.svg dist/favicon.ico || true
fi

# Reload nginx
if command -v nginx >/dev/null 2>&1; then
  info "Reloading nginx"
  sudo nginx -t && sudo systemctl reload nginx || die "nginx reload failed"
fi

# Restart backend via PM2 (if present)
if command -v pm2 >/dev/null 2>&1; then
  info "Restarting PM2 backend (gf.backend)"
  pm2 restart gf.backend || true
  pm2 save || true
fi

# Optional cleanup: keep only runtime essentials in project root
info "Pruning development artifacts"
KEEP_ITEMS=(
  .
  ..
  .git
  .gitignore
  .env.production
  config
  frontend
  dist
  devScripts
  production-deploy.sh
  server.js
  package.json
  package-lock.json
  node_modules
  ecosystem.config.js
  ecosystem.dev.config.js
  logs
  nginx.conf
)

for entry in .* *; do
  skip=false
  for keep in "${KEEP_ITEMS[@]}"; do
    if [ "$entry" = "$keep" ]; then
      skip=true
      break
    fi
  done
  if [ "$skip" = false ] && [ -e "$entry" ]; then
    rm -rf -- "$entry"
  fi
done

echo ""
success "Deployment complete"
echo "Serving from: $REPO_ROOT/dist (-> frontend/dist)"
echo "Check: https://galacticfrontier.h2mcore.ai/?debug=1"