#!/bin/bash
# brokerHub One-Command Deploy (Docker Pre-Installed)
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/dr55621008/platform/main/deploy.sh)
# For private repos: export GITHUB_PAT=your_token before running

set -e

echo "🚀 brokerHub Deployment"
echo "========================"
echo ""

# Generate secure passwords
POSTGRES_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -hex 32)

# Create directory
DEPLOY_DIR="/opt/brokerhub"
mkdir -p "$DEPLOY_DIR" && cd "$DEPLOY_DIR"

# Clone repo (or pull if exists)
if [ -d ".git" ]; then
  echo "📦 Updating repository..."
  git pull origin main
else
  echo "📦 Cloning repository..."
  if [ -n "$GITHUB_PAT" ]; then
    git clone https://${GITHUB_PAT}@github.com/dr55621008/platform.git .
  else
    git clone https://github.com/dr55621008/platform.git .
  fi
fi

# Create .env
echo "⚙️  Creating environment config..."
cat > .env << EOF
# brokerHub Production - Auto-generated $(date +%Y-%m-%d)
POSTGRES_USER=brokerhub
POSTGRES_PASSWORD=$POSTGRES_PASS
JWT_SECRET=$JWT_SECRET
API_PORT=3000
ADMIN_PORT=3001
ADMIN_API_URL=http://localhost:3000
LOG_LEVEL=info
EOF

chmod 600 .env

# Deploy
echo "🐳 Starting Docker containers..."
docker compose -f docker-compose.prod.yml pull || docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Wait for DB
echo "⏳ Waiting for database (30s)..."
sleep 30

# Migrate
echo "📊 Running migrations..."
docker compose -f docker-compose.prod.yml exec -T api npm run migrate || true

# Health check
echo ""
echo "✅ Deployment Complete!"
echo ""

# Get IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "📍 Access brokerHub:"
echo "   API:   http://$SERVER_IP:3000"
echo "   Admin: http://$SERVER_IP:3001"
echo ""
echo "🔐 Save these credentials:"
echo "   POSTGRES_PASSWORD: $POSTGRES_PASS"
echo "   JWT_SECRET: $JWT_SECRET"
echo ""
echo "📋 Useful commands:"
echo "   Logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "   Restart: docker compose -f docker-compose.prod.yml restart"
echo "   Update:  bash <(curl -fsSL https://raw.githubusercontent.com/dr55621008/platform/main/deploy.sh)"
echo ""
