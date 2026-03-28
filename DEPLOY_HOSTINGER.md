# Deploy brokerHub to Hostinger VPS

**Target:** Hostinger VPS (Docker-enabled)  
**Time:** ~15 minutes  
**Cost:** VPS plan + domain (optional)

---

## Prerequisites

### 1. Hostinger VPS Setup

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **VPS** → Select your server
3. Ensure OS is **Ubuntu 22.04** or **Debian 11+**
4. Note your server IP address

### 2. SSH Access

```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Or if you have a non-root user
ssh youruser@YOUR_VPS_IP
```

---

## Step 1: Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add user to docker group (if not root)
usermod -aG docker $USER

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

---

## Step 2: Clone Repository

```bash
# Create app directory
mkdir -p /opt/brokerhub
cd /opt/brokerhub

# Clone repository
git clone https://github.com/dr55621008/platform.git .

# Or copy files via SCP from local machine
# scp -r /local/path/brokerhub/* root@YOUR_VPS_IP:/opt/brokerhub/
```

---

## Step 3: Configure Environment

```bash
# Copy production template
cp .env.production .env

# Edit with your values
nano .env
```

**Required values to set:**

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `POSTGRES_PASSWORD` | Database password | Use a strong password (20+ chars) |
| `JWT_SECRET` | JWT signing key | `openssl rand -hex 32` |

**Example:**

```bash
# Generate JWT secret
openssl rand -hex 32
# Output: a1b2c3d4e5f6... (use this)

# Edit .env
nano .env
```

---

## Step 4: Deploy with Docker Compose

```bash
# Pull latest images (if already built in CI/CD)
docker compose -f docker-compose.prod.yml pull

# Or build locally (takes ~10 min)
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose ps
```

**Expected output:**

```
NAME                  STATUS                    PORTS
brokerhub-postgres    Up (healthy)              5432/tcp
brokerhub-redis       Up (healthy)              6379/tcp
brokerhub-api         Up (healthy)              0.0.0.0:3000->3000/tcp
brokerhub-admin       Up (healthy)              0.0.0.0:3001->80/tcp
```

---

## Step 5: Run Database Migrations

```bash
# Wait for database to be ready (~30 seconds)
sleep 30

# Run migrations
docker compose -f docker-compose.prod.yml exec api npm run migrate
```

**Expected output:**

```
✓ Connected to database
✓ Running migration: 001_initial_schema.sql
✓ Running migration: 002_tenant_schema_template.sql
✓ Running migration: 003_seed_skills.sql
✓ Migrations complete
```

---

## Step 6: Verify Deployment

```bash
# Check API health
curl http://localhost:3000/health

# Expected:
# {"status":"healthy","timestamp":"2026-03-29T...","version":"0.1.0"}

# Check Admin dashboard
curl -I http://localhost:3001/

# Expected: HTTP/1.1 200 OK
```

**Access from browser:**

- **API:** `http://YOUR_VPS_IP:3000`
- **Admin:** `http://YOUR_VPS_IP:3001`

---

## Step 7: Configure Firewall (Hostinger)

### In hPanel:

1. Go to **VPS** → **Network** → **Firewall**
2. Add rules:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH (keep secure) |
| 3000 | TCP | API |
| 3001 | TCP | Admin Dashboard |

### Or via UFW (if enabled):

```bash
# Install UFW if not present
apt install ufw -y

# Allow SSH (IMPORTANT - do this first!)
ufw allow 22/tcp

# Allow application ports
ufw allow 3000/tcp
ufw allow 3001/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Step 8: Set Up Domain (Optional but Recommended)

### Option A: Simple Port Access

```
API:  http://YOUR_VPS_IP:3000
Admin: http://YOUR_VPS_IP:3001
```

### Option B: Domain with Reverse Proxy

1. **Point domain to VPS:**
   - In Hostinger **Domains** → DNS Zone
   - Add A record: `@` → `YOUR_VPS_IP`
   - Add A record: `api` → `YOUR_VPS_IP`
   - Add A record: `admin` → `YOUR_VPS_IP`

2. **Update .env:**
   ```bash
   ADMIN_API_URL=https://api.yourdomain.com
   ```

3. **Enable Traefik (in docker-compose.prod.yml):**
   - Uncomment traefik service
   - Add labels to api and admin services

4. **Restart:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## Maintenance Commands

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f admin
docker compose -f docker-compose.prod.yml logs -f postgres
```

### Restart Services

```bash
# All services
docker compose -f docker-compose.prod.yml restart

# Specific service
docker compose -f docker-compose.prod.yml restart api
```

### Update to Latest Version

```bash
# Pull latest images
cd /opt/brokerhub
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Run new migrations (if any)
docker compose -f docker-compose.prod.yml exec api npm run migrate
```

### Backup Database

```bash
# Backup to file
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U brokerhub brokerhub > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U brokerhub brokerhub < backup_20260329_120000.sql
```

### Stop Services

```bash
# Stop all
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (DELETES DATA)
docker compose -f docker-compose.prod.yml down -v
```

---

## Troubleshooting

### API Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs api

# Common issues:
# - Database not ready: wait for postgres health check
# - Port conflict: change API_PORT in .env
# - Missing env vars: check .env file
```

### Database Connection Failed

```bash
# Check postgres is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U brokerhub -c "SELECT 1"
```

### Admin Dashboard Blank

```bash
# Check browser console for errors
# Common: VITE_API_URL not set correctly

# Update .env and restart
nano .env  # Set ADMIN_API_URL
docker compose -f docker-compose.prod.yml restart admin
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Reduce memory limits in docker-compose.prod.yml
# Or upgrade VPS plan
```

---

## Security Checklist

- [ ] Changed `POSTGRES_PASSWORD` from default
- [ ] Generated secure `JWT_SECRET` (32+ chars)
- [ ] Firewall configured (only ports 22, 3000, 3001 open)
- [ ] Regular backups scheduled
- [ ] Docker auto-updates enabled (optional)
- [ ] SSH key authentication (disable password login)

### Enable Docker Auto-Updates (Optional)

```bash
# Install watchtower
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400 \
  brokerhub-api brokerhub-admin
```

---

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| PostgreSQL | 512MB | 0.5 core |
| Redis | 128MB | 0.1 core |
| API | 512MB | 0.5 core |
| Admin | 128MB | 0.1 core |
| **Total** | **~1.3GB** | **~1.2 cores** |

**Recommended VPS:**
- **Minimum:** 2GB RAM, 2 CPU cores
- **Recommended:** 4GB RAM, 2 CPU cores
- **Production:** 8GB RAM, 4 CPU cores

---

## Next Steps

1. **Create First Tenant** - Use Admin dashboard
2. **Configure S3** - For document storage
3. **Set Up Monitoring** - Uptime monitoring, alerts
4. **Enable HTTPS** - Let's Encrypt via Traefik
5. **Configure Backups** - Automated daily backups

**Need Help?**
- GitHub Issues: https://github.com/dr55621008/platform/issues
- Documentation: `/docs/`
