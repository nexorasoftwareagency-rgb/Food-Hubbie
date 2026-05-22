# Foodhubbie — Enterprise Restaurant SaaS Ecosystem

Multi-tenant restaurant platform with Marketplace, ShopAdmin, SuperAdmin, Rider App, and WhatsApp Bot.

## Architecture

| App | Tech | Purpose |
|---|---|---|
| **Marketplace** | React 19 / Vite / Tailwind / Firebase | Customer-facing PWA |
| **ShopAdmin** | Vanilla JS / Firebase RTDB | Restaurant admin ERP |
| **SuperAdmin** | Vanilla JS / Firebase RTDB | Platform management console |
| **RiderApp** | Vanilla JS / Leaflet.js / PWA | Delivery fleet app |
| **bot** | Node.js / Baileys / WhatsApp | WhatsApp ordering engine |
| **shared** | Node.js modules | Shared business logic, utils, firebase helpers |
| **config** | Node.js module | Firebase config, constants, fee slabs |

Manual books are in `manuals/`:
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

# Deploy all hosting targets (marketplace, admin, rider, superadmin)
npm run deploy:hosting

# Deploy database + storage rules
npm run deploy:rules
```

Hosting targets: `foodhubbie` (marketplace), `foodhubbie-admin` (ShopAdmin), `foodhubbie-rider` (RiderApp), `foodhubbie-superadmin` (SuperAdmin).

## Key Paths

- Marketplace: `D:\Foodhubbie\Marketplace\`
- ShopAdmin: `D:\Foodhubbie\ShopAdmin\`
- SuperAdmin: `D:\Foodhubbie\SuperAdmin\`
- RiderApp: `D:\Foodhubbie\RiderApp\`
- WhatsApp Bot: `D:\Foodhubbie\bot\`
- Shared logic: `D:\Foodhubbie\shared\`
- Config: `D:\Foodhubbie\config\`
- Manuals: `D:\Foodhubbie\manuals\`
- Firebase: `D:\Foodhubbie\firebase.json`, `D:\Foodhubbie\.firebaserc`
