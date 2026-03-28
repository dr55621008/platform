#!/bin/bash
# brokerHub VPS Deployment Script
# Usage: ./scripts/deploy-vps.sh

set -e

echo "=========================================="
echo "  brokerHub VPS Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run as root (sudo)${NC}"
  exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker not found. Installing...${NC}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
  echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
  apt update && apt install -y docker-compose-plugin
fi

# Create directory
DEPLOY_DIR="/opt/brokerhub"
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Creating deployment directory: $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

# Clone or pull
if [ ! -d ".git" ]; then
  echo "Cloning repository..."
  git clone https://github.com/dr55621008/platform.git .
else
  echo "Pulling latest changes..."
  git pull origin main
fi

# Environment setup
if [ ! -f ".env" ]; then
  echo ""
  echo -e "${YELLOW}No .env file found. Setting up...${NC}"
  cp .env.production .env
  
  echo ""
  echo "Generating secure passwords..."
  
  # Generate POSTGRES_PASSWORD
  POSTGRES_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASS/" .env
  
  # Generate JWT_SECRET
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  
  echo -e "${GREEN}✓ Environment configured${NC}"
  echo ""
  echo -e "${RED}IMPORTANT: Save these credentials securely:${NC}"
  echo "  POSTGRES_PASSWORD: $POSTGRES_PASS"
  echo "  JWT_SECRET: $JWT_SECRET"
  echo ""
  echo "They are also stored in .env (chmod 600)"
  chmod 600 .env
else
  echo -e "${GREEN}✓ .env already exists${NC}"
fi

# Pull or build images
echo ""
echo "Pulling Docker images..."
docker compose -f docker-compose.prod.yml pull || {
  echo -e "${YELLOW}Pull failed, building locally...${NC}"
  docker compose -f docker-compose.prod.yml build
}

# Start services
echo ""
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for database
echo ""
echo "Waiting for database to be ready..."
sleep 30

# Run migrations
echo ""
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T api npm run migrate || {
  echo -e "${YELLOW}Migration might have already run or failed. Check logs.${NC}"
}

# Health check
echo ""
echo "Checking service health..."
sleep 5

API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
ADMIN_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ || echo "000")

echo ""
echo "=========================================="
if [ "$API_HEALTH" = "200" ]; then
  echo -e "${GREEN}✓ API is healthy (HTTP $API_HEALTH)${NC}"
else
  echo -e "${RED}✗ API health check failed (HTTP $API_HEALTH)${NC}"
fi

if [ "$ADMIN_HEALTH" = "200" ] || [ "$ADMIN_HEALTH" = "304" ]; then
  echo -e "${GREEN}✓ Admin dashboard is healthy (HTTP $ADMIN_HEALTH)${NC}"
else
  echo -e "${RED}✗ Admin dashboard check failed (HTTP $ADMIN_HEALTH)${NC}"
fi
echo "=========================================="

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "Deployment complete!"
echo ""
echo "Access your services:"
echo "  API:    http://$SERVER_IP:3000"
echo "  Admin:  http://$SERVER_IP:3001"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart:       docker compose -f docker-compose.prod.yml restart"
echo "  Stop:          docker compose -f docker-compose.prod.yml down"
echo "  Update:        ./scripts/deploy-vps.sh"
echo ""
echo -e "${YELLOW}Remember to configure your firewall!${NC}"
echo "  ufw allow 22/tcp && ufw allow 3000/tcp && ufw allow 3001/tcp && ufw enable"
echo ""
