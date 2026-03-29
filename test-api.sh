#!/bin/bash
# brokerHub API Test Script - Run on VPS
echo "🔍 brokerHub Health Check"
echo "=========================="

API_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3001"

# Test API
echo -n "API Health: "
curl -s $API_URL/health | head -c 100
echo ""

# Test Admin
echo -n "Admin: "
curl -s -o /dev/null -w "%{http_code}" $ADMIN_URL
echo ""

# Check tables
echo "Database tables:"
docker exec brokerhub-postgres psql -U brokerhub -d brokerhub -c "\dt" 2>/dev/null || echo "Cannot connect"

echo ""
echo "To create first tenant:"
echo "curl -X POST $API_URL/api/v1/auth/token -H 'Content-Type: application/json' -d '{\"tenant_id\":\"admin\",\"user_id\":\"admin\",\"scope\":[\"admin\"]}'"
