# Foodhubbie — Multi-Tenant Food Ordering SaaS Platform

> **Your Neighbourhood Food Hub** — A Zomato-style marketplace with WhatsApp bot ordering, real-time rider tracking, and multi-outlet management.

---

## Architecture

```
Foodhubbie/
├── config/                 # Firebase config & SaaS constants
├── shared/                 # Multi-tenant helpers & shared utilities
├── Marketplace/            # Customer PWA (React + Vite + Tailwind)
├── ShopAdmin/              # Per-business admin dashboard
├── SuperAdmin/             # Platform owner control center
├── RiderApp/               # Rider delivery portal
├── Bot/                    # Unified WhatsApp bot engine (Node.js)
├── scripts/                # Migration & seed scripts
├── database.rules.json     # Firebase security rules
└── firebase.json           # Hosting configuration
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Marketplace** | React 19, Vite 6, Tailwind CSS 4, Framer Motion, shadcn/ui |
| **Admin/Rider** | Vanilla JS, Firebase SDK, Service Workers (PWA) |
| **Bot Engine** | Node.js, Baileys (WhatsApp Web API), Firebase Admin SDK |
| **Database** | Firebase Realtime Database |
| **Hosting** | Firebase Hosting (multi-site) |
| **Bot Server** | EC2 + PM2 |

## Theme

- **Primary**: Forest Green `#065F46`
- **Secondary**: Amber/Orange `#F59E0B`
- **Background**: Warm Cream `#FFFBEB`
- **Typography**: Plus Jakarta Sans (body) + Syne (headings)
- **Style**: Glassmorphism + micro-animations

## Multi-Tenant Schema

```
/businesses/{businessId}/
  /profile                    → Business metadata
  /outlets/{outletId}/
    /meta                     → Outlet info (name, slug, hours)
    /menu                     → Categories & dishes
    /orders                   → Order history
    /inventory                → Stock tracking
    /settings                 → Delivery fees, contact
    /botUsers                 → WhatsApp user profiles
/admins                       → Global admin accounts
/riders                       → Global rider pool
/bot/{businessId}/{outletId}/ → Bot commands & status
```

## Getting Started

### Marketplace (Customer App)
```bash
cd Marketplace
npm install
npm run dev     # → http://localhost:3000
```

### Bot Engine
```bash
cd Bot
npm install
# Set environment variables:
#   BUSINESS_ID, OUTLET_ID, FIREBASE_DATABASE_URL
node index.js
```

## Firebase Project

- **Project ID**: `food-hubbie`
- **GitHub**: [nexorasoftwareagency-rgb/Food-Hubbie](https://github.com/nexorasoftwareagency-rgb/Food-Hubbie)

## Soul Preservation

The core logic from the original Roshani ERP is preserved:

- ✅ WhatsApp Bot 11-step state machine
- ✅ Real-time rider geolocation heartbeat (30s)
- ✅ OTP-based delivery verification
- ✅ Distance-based delivery fee (Haversine)
- ✅ Admin → Bot command channel
- ✅ Inventory deduction with threshold alerts
- ✅ Stale order auto-cleanup (5hr)

---

**Built by Nexora Software Agency** | Powered by Firebase
