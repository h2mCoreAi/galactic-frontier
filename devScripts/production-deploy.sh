#!/bin/bash

# Galactic Frontier Production Deployment Script
# This script will pull latest code, build frontend, setup backend, and deploy the full-stack application

set -e  # Exit on any error

echo "🚀 Starting Galactic Frontier production deployment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to backup file if it exists
backup_file() {
    if [ -f "$1" ]; then
        cp "$1" "$1.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📋 Backed up $1"
    fi
}

# Step 0: Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists psql; then
    echo "❌ PostgreSQL client is not installed. Please install PostgreSQL client first."
    exit 1
fi

if ! command_exists pm2; then
    echo "❌ PM2 is not installed. Please install PM2 globally: npm install -g pm2"
    exit 1
fi

# Step 1: Pull latest code from GitHub main branch
echo "📥 Pulling latest code from GitHub main branch..."
git checkout main
git pull origin main
git reset --hard origin/main  # Ensure working directory matches repository

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Setup environment variables
echo "🔧 Setting up environment variables..."
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating production environment file..."
    cat > "$ENV_FILE" << EOF
# Production Environment Variables for Galactic Frontier
NODE_ENV=production
PORT=3001

# Database Configuration (Update these with your actual values)
DATABASE_URL=postgresql://galactic_frontier:galactic_frontier@localhost:5433/galactic_frontier

# JWT Configuration
JWT_SECRET=galactic_frontier_production_jwt_secret_change_this_in_production_$(openssl rand -hex 32)
JWT_REFRESH_SECRET=galactic_frontier_production_refresh_secret_change_this_in_production_$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Discord OAuth (Configure when ready for production)
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Frontend Configuration
FRONTEND_URL=https://galacticfrontier.h2mcore.ai
CORS_ORIGIN=https://galacticfrontier.h2mcore.ai

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
EOF
    echo "⚠️  IMPORTANT: Please update the DATABASE_URL and Discord credentials in $ENV_FILE"
    echo "⚠️  Also update JWT_SECRET with a secure production key"
else
    echo "✅ Production environment file already exists"
fi

# Step 4: Setup database
echo "🗄️  Setting up database..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Please configure it in $ENV_FILE"
    echo "For now, assuming database is already configured..."
else
    echo "🔍 Checking database connection..."
    if npm run db:test 2>/dev/null; then
        echo "✅ Database connection successful"
    else
        echo "⚠️  Could not connect to database. Please ensure PostgreSQL is running and credentials are correct."
        echo "You may need to create the database and user first:"
        echo "  createdb galactic_frontier"
        echo "  createuser galactic_frontier"
        echo "  psql -c 'GRANT ALL PRIVILEGES ON DATABASE galactic_frontier TO galactic_frontier;'"
    fi

    # Run database migrations
    echo "📄 Running database migrations..."
    if [ -f "shared/migrations/001_initial_schema.sql" ]; then
        PGPASSWORD=$(echo $DATABASE_URL | sed 's/.*:\/\/.*:\(.*\)@.*/\1/') \
        psql $(echo $DATABASE_URL | sed 's|postgresql://\([^:]*\):\([^@]*\)@\([^/]*\)/\(.*\)|-h \3 -U \1 -d \4|') \
        -f shared/migrations/001_initial_schema.sql
        echo "✅ Database schema created/updated"
    else
        echo "⚠️  Migration file not found: shared/migrations/001_initial_schema.sql"
    fi
fi

# Step 5: Build production assets
echo "🔨 Building production assets..."
npm run build

# Step 6: Preserve important files during cleanup
echo "🛡️  Preserving important files..."
SCRIPT_NAME=$(basename "$0")
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$SCRIPT_NAME"
TEMP_SCRIPT="/tmp/${SCRIPT_NAME}.backup"

cp "$SCRIPT_PATH" "$TEMP_SCRIPT"
cp ".env.production" "/tmp/.env.production.backup" 2>/dev/null || true
cp "ecosystem.config.js" "/tmp/ecosystem.config.js.backup" 2>/dev/null || true

echo "Script backed up to: $TEMP_SCRIPT"

# Step 7: Clean up development files (keep production essentials)
echo "🧹 Cleaning up development files..."
# Keep: dist/, .git/, .env.production, ecosystem.config.js, server.js, package.json, package-lock.json, node_modules/
find . -maxdepth 1 -type f \
    -not -name ".env.production" \
    -not -name "ecosystem.config.js" \
    -not -name "server.js" \
    -not -name "package.json" \
    -not -name "package-lock.json" \
    -not -name "*.sh" \
    -delete 2>/dev/null || true

# Remove development directories but keep node_modules and dist
for dir in src docs tests devScripts single-player shared mmo; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "Removed development directory: $dir"
    fi
done

# Step 8: Restore preserved files
echo "📋 Restoring preserved files..."
mv "$TEMP_SCRIPT" "./$SCRIPT_NAME"
chmod +x "./$SCRIPT_NAME"

# Step 9: Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Step 10: Start production services with PM2
echo "🚀 Starting production services..."

# Create production ecosystem config if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
    cat > "ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'gf.frontend',
      script: 'npx',
      args: 'serve dist -s -l 5174',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'gf.backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
}
EOF
    echo "✅ Created production ecosystem config"
fi

# Start the services
pm2 start ecosystem.config.js --env production

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Step 11: Verify deployment
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
pm2 list
echo ""
echo "🌐 Frontend should be available at: https://galacticfrontier.h2mcore.ai"
echo "🔗 Backend API should be available at: https://galacticfrontier.h2mcore.ai/api"
echo ""
echo "🧪 Test Commands:"
echo "  curl https://galacticfrontier.h2mcore.ai/api/health"
echo "  pm2 logs gf.backend --lines 10"
echo "  pm2 logs gf.frontend --lines 10"
echo ""
echo "🎮 Your full-stack Galactic Frontier is ready for production!"
echo "📝 Remember to configure Discord OAuth credentials when ready for user authentication"
