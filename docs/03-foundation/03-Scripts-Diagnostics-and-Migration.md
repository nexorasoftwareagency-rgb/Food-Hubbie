# Scripts, Diagnostics & Migration Tools

**Source**: `scripts/` (19 files), `scratch/` (20 files), `generate.md` reference  
**Purpose**: Seeding, auditing, migration, diagnostics, credential management

---

## 1. Code-Logics

### `scripts/` — Production Utilities

| Script | Purpose | RTDB Path(s) touched |
|---|---|---|
| `create-superadmin.js` | Create initial SuperAdmin auth + RTDB entry | `admins/{uid}`, `system/admins/{uid}` |
| `seed-business.js` | Create a business in the registry | `businesses/{bid}` |
| `seed-outlets.js` | Provision outlets + initial settings | `businesses/{bid}/outlets/{oid}/*` |
| `seed-test-orders.js` | Generate mock orders for analytics testing | `businesses/{bid}/outlets/{oid}/orders/{pushId}` |
| `seed-bot-routing.js` | Register a bot tenant in the registry | `system/bot_routing/{phone}` |
| `migrate-legacy-data.js` | Deep sync legacy data (Pizza-Shop, Cake-Shop) → multi-tenant schema | `businesses/{bid}/outlets/{oid}/*` |
| `migrate-menu-items.js` | Standardize catalog schema across legacy outlets | `dishes/{dishId}` |
| `sync-catalog.js` | Sync menu across outlets | `businesses/{bid}/outlets/{oid}/dishes` |
| `peek-db.js` | Quick audit of top-level keys + business structures | Read all roots |
| `list-bot-tenants.js` | List all registered bot tenants | `system/bot_routing/` |
| `check-migration.js` | Verify migration completeness | `businesses/{bid}/outlets/{oid}` |
| `cleanup-orders.js` | Remove stale/archived orders | `businesses/{bid}/outlets/{oid}/orders/{id}` |
| `extract-credentials.js` | Extract live credentials from DB | `admins/`, `system/admins/` |
| `generate-credentials-doc.js` | Write credentials to `Credential.md` | Same as above |
| `audit-buttons.js` | Audit button handlers across Admin Dashboard | N/A (code analysis) |
| `audit-rider-buttons.js` | Audit button handlers in Rider App | N/A (code analysis) |
| `test-paths.js` | Verify path resolution logic | N/A (unit test) |
| `data/dev/` | Development data files | N/A |

### `scratch/` — Diagnostic Tools (20 files)

| File | Purpose |
|---|---|
| `deep_audit.js` | Comprehensive database audit |
| `deep-search-cake.js` | Search cake outlet data |
| `explore_root.js` | Explore root-level keys |
| `list-root.js` | List top-level nodes |
| `check-legacy.js` | Check legacy schema data |
| `check-outlets.js` | Verify outlet structure |
| `check-admins.js` | Verify admin records |
| `check-users.js` | Verify user records |
| `check-roshani.js` | Roshani business specialized audit |
| `check-prashant.js` | Prashant business specialized audit |
| `check-cake.js` | Cake outlet data verification |
| `find-cake.js` | Find cake outlet data |
| `verify_ecosystem.js` | Verify complete ecosystem state |
| `verify_admin_features.js` | Verify admin feature completeness |
| `seed_promotions.js` | Seed promotional data for testing |
| `seed_audit_log.js` | Seed audit log for testing |
| `inject_data.js` | Inject test data into database |
| `create_system_admin.js` | Create system admin account |
| `audit_orders.js` | Detailed order audit |
| `service-account.json` | Firebase service account (development) |

---

## 2. Firebase-Rules

Scripts run with either `firebase-admin` SDK (service account, bypasses rules) or with user credentials from `admins/` RTDB node. Destructive scripts (`cleanup-orders.js`, `migrate-*.js`) require superadmin-level permissions.

---

## 3. Database-Structure

Scripts access the full canonical RTDB tree (see `docs/00-master/00-DATA-MODEL.md`). Migration scripts specifically read from legacy paths (`Pizza-Shop/`, `Cake-Shop/`) and write to SaaS paths (`businesses/{bid}/outlets/{oid}/`).

---

## 4. Connecting-Nodes

```
[Onboarding a new business partner]
  1. seed-business.js --name="Acme Bites" --email="admin@acme.com"
     → Creates businesses/{new_bid} with commission config
  2. seed-outlets.js --biz={new_bid} --outlet="outlet_main"
     → Creates businesses/{new_bid}/outlets/outlet_main with default settings
  3. create-superadmin.js --email="admin@acme.com" --bid={new_bid} --oid="outlet_main"
     → Creates Firebase Auth account + writes admins/{uid}
  4. seed-bot-routing.js --phone=91xxxxxxxxxx --biz={new_bid} --outlet="outlet_main"
     → Registers bot tenant in system/bot_routing/
  5. PM2 restart → bot picks up new tenant
  6. Scan QR code → bot goes online for new tenant

[Verifying migration completeness]
  1. node scripts/check-migration.js
  2. Reads all businesses/{bid}/outlets/{oid}/
  3. Compares against legacy Pizza-Shop/ and Cake-Shop/
  4. Reports: migrated count, remaining count, missing fields, orphans
```

---

## 5. Complete Flow: Legacy Data Migration

1. Run `node scripts/migrate-legacy-data.js`
2. Script reads `Pizza-Shop/orders/`, `Pizza-Shop/dishes/`, `Pizza-Shop/categories/`, `Pizza-Shop/settings/`
3. Maps legacy outlet IDs to new `businesses/{bid}/outlets/{oid}/` structure
4. Writes each collection to the SaaS paths
5. Preserves original node keys for cross-referencing
6. Logs skipped items (duplicates, invalid data)
7. Run `node scripts/check-migration.js` to verify
8. After verification, legacy paths set to read-only in `database.rules.json`
