# Foodhubbie — Enterprise Restaurant SaaS Ecosystem

Multi-tenant restaurant platform with Marketplace (customer PWA), ShopAdmin (restaurant ERP), SuperAdmin (platform console), Rider App (delivery), WhatsApp Bot, and QR Ordering (customer-facing menu).

## Architecture

| App | Tech | Purpose |
|---|---|---|
| **Marketplace** | React 19 / Vite / Tailwind / Firebase | Customer-facing PWA |
| **ShopAdmin** | Vanilla JS / Firebase RTDB | Restaurant admin ERP |
| **SuperAdmin** | Vanilla JS / Firebase RTDB | Platform management console |
| **RiderApp** | Vanilla JS / Leaflet.js / PWA | Delivery fleet app |
| **QR Ordering — Menu** | Vanilla JS / Firebase RTDB | Customer-facing digital menu (QR) |
| **QR Ordering — Admin** | React / Vite / MUI / Firebase RTDB | Table management dashboard |
| **bot** | Node.js / Baileys / WhatsApp | WhatsApp ordering engine |
| **shared** | Node.js modules | Shared business logic, utils, firebase helpers |
| **config** | Node.js module | Firebase config, constants, fee slabs |

Manuals are in `manuals/`:
- `ShopAdmin-Manual.md` — Restaurant workflows (menu, orders, reports)
- `Marketplace-Manual.md` — Customer ordering guide
- `SuperAdmin-Manual.md` — Enterprise control center (onboarding, RBAC, settlements)
- `RiderApp-Manual.md` — Delivery partner guide

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start Marketplace dev server
npm run dev:marketplace

# Start WhatsApp bot
npm run dev:bot
```

## Deployment

```bash
# Build Marketplace (React → static)
cd Marketplace && npm run build

# Deploy all hosting targets
firebase deploy --only hosting:foodhubbie         # Marketplace
firebase deploy --only hosting:foodhubbie-admin    # ShopAdmin
firebase deploy --only hosting:foodhubbie-rider    # RiderApp
firebase deploy --only hosting:foodhubbie-superadmin # SuperAdmin
firebase deploy --only hosting:foodhubbie-menu     # QR Ordering Menu

# Deploy database + storage rules
firebase deploy --only database,storage

# Or deploy everything at once
firebase deploy
```

## Key Paths

- Marketplace: `D:\Foodhubbie\Marketplace\`
- ShopAdmin: `D:\Foodhubbie\ShopAdmin\`
- SuperAdmin: `D:\Foodhubbie\SuperAdmin\`
- RiderApp: `D:\Foodhubbie\RiderApp\`
- QR Ordering Menu: `D:\Foodhubbie\QR Ordering Feature\Menu\`
- QR Ordering Admin: `D:\Foodhubbie\QR Ordering Feature\admin-dashboard\`
- WhatsApp Bot: `D:\Foodhubbie\bot\`
- Shared logic: `D:\Foodhubbie\shared\`
- Config: `D:\Foodhubbie\config\`
- Manuals: `D:\Foodhubbie\manuals\`
- Firebase: `D:\Foodhubbie\firebase.json`, `D:\Foodhubbie\.firebaserc`

## Hosting URLs

| Target | URL |
|---|---|
| `foodhubbie` | https://foodhubbie.web.app |
| `foodhubbie-admin` | https://foodhubbie-admin.web.app |
| `foodhubbie-superadmin` | https://foodhubbie-superadmin.web.app |
| `foodhubbie-rider` | https://foodhubbie-rider.web.app |
| `foodhubbie-menu` | https://foodhubbie-menu.web.app |
