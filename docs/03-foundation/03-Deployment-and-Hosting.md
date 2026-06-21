# Deployment & Hosting — Infrastructure Topology

**Firebase project**: `food-hubbie`  
**Version control**: Git (GitHub)  
**CI/CD**: Manual (`firebase deploy`, PM2)

---

## 1. Code-Logics

### Firebase Hosting Targets

From `firebase.json` (137 lines):

| Target | Source directory | Public URL | Build command |
|---|---|---|---|
| `marketplace` | `Marketplace/dist` | `foodhubbie-marketplace.web.app` | `cd Marketplace && npm run build` |
| `admin` | `admin-dashboard/dist` | `foodhubbie-admin.web.app` | `cd admin-dashboard && npm run build` |
| `rider` | `RiderApp/` | `foodhubbie-rider.web.app` | N/A (vanilla JS, no build) |
| `superadmin` | `SuperAdmin/` | `foodhubbie-superadmin.web.app` | N/A (vanilla JS, no build) |
| `supreme` | `SupremeAdmin/` | `foodhubbie-supremeadmin.web.app` | N/A (vanilla JS, no build) |

All targets share:
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` header
- Rewrites: `**` → `/index.html` (SPA fallback)

### `.firebaserc` Project Bindings

```json
{
  "projects": { "default": "food-hubbie" },
  "targets": {
    "food-hubbie": {
      "hosting": {
        "marketplace": ["foodhubbie"],
        "admin": ["foodhubbie-admin"],
        "rider": ["foodhubbie-rider"],
        "superadmin": ["foodhubbie-superadmin"],
        "supreme": ["foodhubbie-supremeadmin"]
      }
    }
  }
}
```

### NPM Workspaces (`package.json` root)

```json
"workspaces": ["Marketplace", "admin-dashboard", "bot", "shared", "config"]
```

Key scripts:
| Script | Action |
|---|---|
| `npm run install:all` | Install all workspace deps |
| `npm run dev:bot` | Start bot in watch mode |
| `npm run dev:marketplace` | Vite dev server (port 5173) |
| `npm run dev:admin-dashboard` | Vite dev server (port 5174) |
| `npm run deploy:hosting` | `firebase deploy --only hosting` |
| `npm run deploy:rules` | `firebase deploy --only database,storage` |

### Bot Deployment (EC2 + PM2)

**Single process** (`bot/ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: "foodhubbie-bot",
    script: "index.js",
    cwd: __dirname,
    env: { FIREBASE_DATABASE_URL: "..." },
    max_memory_restart: "600M",
    exp_backoff_restart_delay: 5000,
    max_restarts: 20
  }]
}
```

**PM2 commands**:
```bash
# Start
pm2 start ecosystem.config.js
# View status
pm2 status
# Logs (tenant-prefixed, greppable)
pm2 logs foodhubbie-bot | grep '\[roshani-pizza\]'
# Monitor
pm2 monit
# Restart
pm2 restart foodhubbie-bot
```

### Bot First-Time Setup (QR Scan)
```bash
pm2 stop foodhubbie-bot
rm -rf bot/session_data_*   # Clear old sessions
pm2 start foodhubbie-bot
pm2 logs foodhubbie-bot     # Scan QR from logs
```

---

## 2. Firebase-Rules

Deployment captures both `database.rules.json` and `storage.rules` via:
```bash
firebase deploy --only database,storage
```

---

## 3. Database-Structure

N/A.

---

## 4. Connecting-Nodes

```
[Developer pushes code to GitHub]
  -> SSH into EC2: ssh ubuntu@<instance-ip>
  -> git pull origin main (from monorepo root)
  -> pm2 restart foodhubbie-bot (bot only)
  -> cd Marketplace && npm run build (if Marketplace changed)
  -> cd admin-dashboard && npm run build (if admin changed)
  -> firebase deploy --only hosting (if any frontend changed)

[Adding a new tenant to the bot]
  -> node scripts/seed-bot-routing.js --phone=91xxxxxxxxxx --biz=business_id --outlet=outlet_id
  -> pm2 restart foodhubbie-bot
  -> Scan QR code from logs
  -> No code change, no new PM2 entry
```

---

## 5. Complete Flow: Production Deployment

1. Developer commits changes, pushes to GitHub
2. SSH into EC2 instance (`ssh ubuntu@172.31.14.126`)
3. `cd ~/foodhubbie && git pull origin main`
4. If bot changed: `pm2 restart foodhubbie-bot`
5. If Marketplace changed: `cd Marketplace && npm run build && cd ..`
6. If admin-dashboard changed: `cd admin-dashboard && npm run build && cd ..`
7. `firebase deploy --only hosting` (deploys all 5 targets)
8. Verify: visit each portal URL + check `pm2 logs`
9. Rollback if needed: `git reset --hard HEAD@{1}` + rebuild + redeploy
