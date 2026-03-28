# Deploy brokerHub in 1 Command

**Time:** 5 minutes  
**Requirements:** Docker installed on VPS

---

## Quick Deploy

```bash
# SSH to your VPS, then run:
bash <(curl -fsSL https://raw.githubusercontent.com/dr55621008/platform/main/deploy.sh)
```

**That's it.** The script:
1. Clones the repository
2. Generates secure passwords
3. Starts all containers
4. Runs database migrations
5. Verifies health checks

---

## Database — Do You Need to Worry?

**No.** The database is fully automated:

| Concern | Handled By |
|---------|------------|
| **Installation** | Docker pulls PostgreSQL 15 automatically |
| **Configuration** | Pre-configured in `docker-compose.prod.yml` |
| **Migrations** | Run automatically on first deploy |
| **Backups** | Data persists in Docker volume (`postgres_data`) |
| **Updates** | Schema migrations run on each update |

**Data Persistence:**
- Database stored in Docker volume: `postgres_data`
- Survives container restarts
- Survives `docker compose down`
- **Only deleted** if you run `docker compose down -v`

**Backup (Optional):**
```bash
# Manual backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U brokerhub brokerhub > backup.sql

# Restore
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U brokerhub brokerhub < backup.sql
```

---

## After Deploy

### 1. Access Admin Dashboard

```
http://YOUR_VPS_IP:3001
```

### 2. Create First Tenant

Use the Admin UI to create your first tenant (insurance broker).

### 3. Configure Firewall

```bash
# Allow traffic
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw enable
```

---

## Update brokerHub

```bash
# Re-run the same deploy script
bash <(curl -fsSL https://raw.githubusercontent.com/dr55621008/platform/main/deploy.sh)
```

Updates will:
1. Pull latest code
2. Rebuild images
3. Run new migrations
4. Restart containers
5. **Preserve all data**

---

## Troubleshooting

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Check Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Restart
```bash
docker compose -f docker-compose.prod.yml restart
```

### Reset Everything (⚠️ DELETES DATA)
```bash
docker compose -f docker-compose.prod.yml down -v
# Then re-run deploy script
```

---

## What Gets Deployed

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | 5432 (internal) | Database |
| **Redis** | 6379 (internal) | Sessions, caching |
| **API** | 3000 | Backend API |
| **Admin** | 3001 | Web dashboard |

**Total Memory:** ~1.3GB  
**Total CPU:** ~1.2 cores

---

**Need Help?**  
GitHub Issues: https://github.com/dr55621008/platform/issues
