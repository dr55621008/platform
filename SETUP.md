# brokerHub Setup Guide

**Version:** 0.1.0  
**Last Updated:** 2026-03-28

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone Repository

```bash
git clone https://github.com/dr55621008/platform.git brokerhub
cd brokerhub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# API Service
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# Admin Dashboard
cp apps/admin/.env.example apps/admin/.env
# Edit apps/admin/.env with your values

# Root
cp .env.example .env
# Edit .env with your values
```

### 4. Start Development Stack

```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# Check status
docker compose ps

# Expected:
# brokerhub-postgres   Up (healthy)
# brokerhub-redis      Up (healthy)
# brokerhub-api        Up
# brokerhub-admin      Up
# brokerhub-pgadmin    Up
```

### 5. Run Migrations

```bash
# Wait for database to be ready (~30 seconds)
docker compose exec api npm run migrate
```

### 6. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:3000 | - |
| **Admin Dashboard** | http://localhost:3001 | - |
| **pgAdmin** | http://localhost:5050 | admin@brokerhub.com / admin |
| **PostgreSQL** | localhost:5432 | postgres / postgres |
| **Redis** | localhost:6379 | - |

---

## API Testing

### Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-28T...",
  "version": "0.1.0"
}
```

### Create Tenant (Admin)

```bash
# First, get a token (for admin access)
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "admin",
    "user_id": "admin",
    "scope": ["admin", "read", "write"]
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGVuYW50X2FkbWlu...",
  "expires_in": 900
}
```

### Create Tenant

```bash
curl -X POST http://localhost:3000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "company_id": "acme_insurance_ltd",
    "agent_id": "agent_acme_001",
    "initial_credits": 1000
  }'
```

### Get Credit Balance

```bash
curl http://localhost:3000/api/v1/tenants/tenant_acme_insurance/balance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Production Deployment

### 1. Build Images

```bash
docker compose build
```

### 2. Set Production Environment

```bash
# Required environment variables
export JWT_SECRET=<secure-random-string>
export DATABASE_URL=postgresql://user:pass@host:5432/brokerhub
export REDIS_URL=redis://host:6379
export S3_BUCKET=brokerhub-production
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>
```

### 3. Deploy

```bash
docker compose -f docker-compose.yml up -d
```

### 4. Verify

```bash
curl https://api.brokerhub.com/health
curl https://admin.brokerhub.com/
```

---

## Development Workflow

### Hot Reload

Both API and Admin services support hot reload in development mode:

```bash
# API - auto-reloads on TypeScript changes
docker compose exec api npm run dev

# Admin - auto-reloads on React changes
docker compose exec admin npm run dev
```

### Running Tests

```bash
# API tests
docker compose exec api npm test

# With coverage
docker compose exec api npm run test:coverage
```

### Database Access

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d brokerhub

# View tables
\dt

# View tenant schemas
\dn tenant_*
```

---

## Troubleshooting

### API Won't Start

```bash
# Check logs
docker compose logs api

# Common issues:
# - Database not ready (wait for health check)
# - Port already in use (change API_PORT in .env)
# - Missing environment variables
```

### Admin Dashboard Blank

```bash
# Check browser console for errors
# Common issues:
# - API not accessible (check VITE_API_URL)
# - CORS errors (ensure API is running)
```

### Database Migration Fails

```bash
# Reset database (DEVELOPMENT ONLY)
docker compose down -v
docker compose up -d postgres
# Wait for health check
docker compose exec api npm run migrate
```

---

## Next Steps

1. **Customize Branding** - Update `assets/brand/brand-tokens.json`
2. **Configure S3** - Set up document storage
3. **Set Up Monitoring** - Configure Prometheus + Grafana
4. **Enable CI/CD** - GitHub Actions will auto-deploy on push to main

---

**Need Help?**  
- Documentation: `/docs/`
- API Spec: `/docs/api/`
- GitHub Issues: https://github.com/dr55621008/platform/issues
