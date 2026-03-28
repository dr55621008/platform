# Deploy brokerHub in 1 Command

**Time:** 3 minutes  
**Requirements:** Docker + Docker Compose on VPS

---

## Quick Deploy

```bash
# SSH to your VPS, then run:
bash <(curl -fsSL https://raw.githubusercontent.com/dr55621008/platform/main/deploy.sh)
```

**That's it.**

---

## Database? Don't Worry.

**Fully automated** — PostgreSQL runs as a Docker container:
- ✅ Auto-installs
- ✅ Auto-migrates
- ✅ Data persists in Docker volume
- ✅ Survives restarts

---

## Access

- **API:** `http://YOUR_VPS_IP:3000`
- **Admin:** `http://YOUR_VPS_IP:3001`

Script shows passwords — **save them!**

---

## Update

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/dr55621008/platform/main/deploy.sh)
```

---

**Need Help?**  
GitHub Issues: https://github.com/dr55621008/platform/issues
