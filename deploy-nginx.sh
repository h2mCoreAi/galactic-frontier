#!/bin/bash
# Nginx Deployment Script for Galactic Frontier
# This script sets up nginx to serve the game

set -e

echo "🚀 Deploying Galactic Frontier with Nginx..."

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo"
   exit 1
fi

# Variables
NGINX_SITE="/etc/nginx/sites-available/galactic-frontier"
NGINX_ENABLED="/etc/nginx/sites-enabled/galactic-frontier"
PROJECT_ROOT="/srv/galactic-frontier"
GAME_DIR="$PROJECT_ROOT/single-player/src"

echo "📁 Setting up nginx configuration..."

# Copy nginx config to sites-available
cp "$PROJECT_ROOT/nginx.conf" "$NGINX_SITE"

# Create symlink to sites-enabled
ln -sf "$NGINX_SITE" "$NGINX_ENABLED"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Set proper permissions
chown -R www-data:www-data "$PROJECT_ROOT/logs"
chmod 755 "$PROJECT_ROOT/logs"

echo "✅ Nginx configuration deployed"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [[ $? -eq 0 ]]; then
    echo "✅ Nginx configuration is valid"
    echo "🔄 Reloading nginx..."
    systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    echo ""
    echo "🎮 Galactic Frontier is now served at:"
    echo "   Frontend: http://localhost:5174"
    echo "   API Proxy: http://localhost:5174/api/ -> http://127.0.0.1:3001"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Start your backend API server on port 3001"
    echo "   2. Visit http://localhost:5174 to play the game"
    echo "   3. Check logs at $PROJECT_ROOT/logs/"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi
