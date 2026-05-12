# 🍕 Foodhubbie SaaS Platform

A high-performance, multi-tenant Restaurant-as-a-Service (RaaS) platform built with true triple isolation (Firebase, GitHub, EC2).

## 📂 Project Structure

```text
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
