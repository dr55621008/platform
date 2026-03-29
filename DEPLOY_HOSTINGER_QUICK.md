# Deploy to Hostinger VPS

## Option 1: SSH Deploy (Recommended - 3 minutes)

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Run deploy script with PAT token
export GITHUB_PAT=your_github_pat_token
bash <(curl -fsSL https://raw.githubusercontent.com/dr55621008/platform/main/deploy.sh)
```

**This bypasses Hostinger's Docker UI entirely** — uses pre-built images from GitHub Container Registry.

---

## Option 2: Hostinger Docker UI (10 minutes)

### Step 1: Configure Docker Compose

In Hostinger Docker panel:
1. **Docker Compose** → **Add Project**
2. Project name: `brokerhub`
3. Compose file: `docker-compose.hostinger.yml`
4. Git repository: `https://github.com/dr55621008/platform.git`
5. Branch: `main`

### Step 2: Set Environment Variables

In Hostinger Docker → Environment variables:

| Variable | Value |
|----------|-------|
| `POSTGRES_PASSWORD` | Your secure password |
| `JWT_SECRET` | Run `openssl rand -hex 32` locally |

### Step 3: Deploy

Click **Deploy** — Hostinger will:
1. Clone your repo
2. Build API image (~5 min)
3. Build Admin image (~3 min)
4. Start all containers

### Step 4: Expose Ports

In Hostinger → Network → Firewall:
- Allow port `3000` (API)
- Allow port `3001` (Admin)

Access:
- API: `http://YOUR_VPS_IP:3000`
- Admin: `http://YOUR_VPS_IP:3001`

---

## Why SSH Deploy is Better

| SSH Deploy | Hostinger Docker UI |
|------------|---------------------|
| 3 minutes | 10+ minutes |
| Pre-built images | Builds from scratch |
| Works with private repos | Needs public repo or SSH key |
| Full control | Limited UI options |

**Recommendation: Use SSH deploy.**
