# 🚀 Foodhubbie — Enterprise Restaurant SaaS Ecosystem

A high-performance, multi-tenant platform designed for rapid restaurant scaling. Foodhubbie provides a unified experience across Marketplace, Admin ERP, WhatsApp Bot, and Rider Fleet.

## 💎 Premium Experience Standard
- **Universal Marketplace**: High-end React PWA with "Vibrant Orange" design tokens and glassmorphism.
- **SaaS Discovery**: Exhaustive global crawler for cross-outlet dish search and restaurant branding.
- **Unified Branding**: Absolute visual consistency across all touchpoints (Marketplace, Bot, Admin, Rider).

## 🏗️ Multi-Tenant Architecture
- **Tenant Isolation**: Dynamic `BUSINESS_ID` and `OUTLET_ID` scoping across all Firebase interactions.
- **Shared Service Layer**: Unified helpers in `/shared` powering both Node.js (Bot) and Browser environments.
- **Hardened Security**: Production-grade `database.rules.json` (v2.1) with granular read/write permissions.

## 📂 Project Structure
root/
├── ShopAdmin/        # Restaurant Admin ERP (Vanilla JS/CSS)
├── RiderApp/         # Delivery Rider Application (Vanilla JS/CSS)
├── Marketplace/      # Customer-facing PWA (React/Tailwind)
├── SuperAdmin/       # Platform Onboarding & Management
├── bot/              # Unified WhatsApp Bot Engine (Node.js/Baileys)
├── shared/           # Shared Business Logic & Utilities
├── config/           # Global SaaS Configuration & Constants
├── docs/             # Deployment & Architecture Guides
├── scripts/          # Automation & Maintenance Scripts
└── firebase.json     # Multi-target Hosting & Security Rules
```

## 🚀 Key Features

*   **Multi-Tenancy**: Hierarchical path resolution (`businesses/{bid}/outlets/{oid}/`).
*   **Real-time Logic**: Live order tracking, inventory deductions, and WhatsApp status updates.
*   **Triple Isolation**: Dedicated production Firebase project, GitHub repository, and isolated EC2 environments.
*   **Unified UI**: Shared design language across all touchpoints (Admin, Rider, Marketplace).

## 🛠️ Management Commands

Manage the entire platform from the root using NPM Workspaces:

```bash
# Install dependencies for all apps
npm run install:all

# Start the WhatsApp Bot
npm run dev:bot

# Start the Marketplace PWA
npm run dev:marketplace

# Deploy Hosting (Admin & Rider)
npm run deploy:hosting

# Deploy Security Rules
npm run deploy:rules
```

## 📖 Documentation

*   [Deployment Guide](docs/deployment_guide.md)
*   [Architecture Overview](docs/architecture.md)

---
Powered by **Foodhubbie SaaS Engine**
