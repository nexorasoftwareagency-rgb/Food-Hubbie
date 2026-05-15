# Foodhubbie Generation & Seeding Guide

This document lists all available scripts for generating data, seeding the database, and managing system credentials.

## 🔑 Administrative Setup
### Create Super Admin
Initializes the master administrative account with root privileges.
```bash
node scripts/create-superadmin.js
```

## 🏬 Ecosystem Seeding
### Seed Outlets
Provisions the initial "Roshani Group" business and its primary nodes (Pizza & Cake).
```bash
node scripts/seed-outlets.js
```

### Seed Test Orders
Generates a suite of mock orders across all outlets for analytics testing.
```bash
node scripts/seed-test-orders.js
```

## 📊 Documentation Generation
### Generate Credentials Doc
Extracts all live credentials and slugs from the database into `Credential.md`.
```bash
node scripts/generate-credentials-doc.js
```

## 🚚 Migration Utilities
### Migrate Menu Items
Standardizes the catalog schema across all legacy outlets.
```bash
node scripts/migrate-menu-items.js
```

### Migrate Legacy Data
Performs a deep sync of historical order and customer data into the multi-tenant architecture.
```bash
node scripts/migrate-legacy-data.js
```

## 🛠️ Diagnostic Tools
### Peek Database
Quickly audits the top-level keys and business structures in the Realtime Database.
```bash
node scripts/peek-db.js
```

### Test Paths
Validates the database routing logic for various business/outlet combinations.
```bash
node scripts/test-paths.js
```
