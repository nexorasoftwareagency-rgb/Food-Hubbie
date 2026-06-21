# Manuals & Knowledge Base — User-Facing Guides

Cross-reference index of all existing manuals currently in the project, plus canonical locations for the new documentation structure.

---

## 1. Code-Logics

### Existing Manuals (legacy — preserved, not deleted)

| Document | Path | Audience | Content |
|---|---|---|---|
| FoodHubbie Fixes | `docs/FoodHubbie-Fixes.md` | Developers | Bug fix catalog, known issues, workarounds |
| FoodHubbie Audit Report | `docs/FoodHubbie-Audit-Report.md` | Developers | Full audit findings, recommendations |
| DEEP-AUDIT-PLAN | `docs/DEEP-AUDIT-PLAN.md` | Developers | Audit methodology, scope |
| Data Sync Contract | `docs/Data-Sync.md` | Developers | Canonical RTDB tree, order lifecycle, multi-tenant invariants |
| Brand & Theme Tokens | `docs/brand-tokens.md` | Developers/Designers | Color palette matrix, per-tenant overrides, anti-patterns |
| ShopAdmin v2 Parity | `docs/shopadmin-v2-parity.md` | Developers | v1 vs v2 comparison, migration, risks |
| Bot Operations | `docs/bot-operations.md` | Developers | Bot deployment, QR scanning, tenant management |
| Bot Multi-Tenant | `docs/bot-multi-tenant.md` | Developers | Bot multi-tenant architecture |
| RECOMMENDATIONS-PENDING | `docs/RECOMMENDATIONS-PENDING.md` | Developers | Outstanding recommendations |
| PHASE0-10-VERIFICATION-CHECKLIST | `docs/PHASE0-10-VERIFICATION-CHECKLIST.md` | QA | End-to-end verification checklist |
| PHASE1-7 VERIFICATION/REPORTS | `docs/PHASE{1..7}-*.md` | QA | Phase-wise verification results |
| generate.md | `docs/generate.md` | Developers | Documentation generation reference |

### New Canonical Manuals (this directory)

| Document | Audience | Content |
|---|---|---|
| `docs/00-master/00-INDEX.md` | Everyone | Master TOC linking all new + existing docs |
| `docs/00-master/00-ARCHITECTURE.md` | Architects/Developers | C4 model: all portals, bot, legacy |
| `docs/00-master/00-DATA-MODEL.md` | Developers | Canonical RTDB tree, all nodes, TS types |
| `docs/01-portals/01-Marketplace.md` | Developers | Marketplace features, services, checkout |
| `docs/01-portals/01-Admin-Dashboard.md` | Developers | Sections, components, printing, firebase |
| `docs/01-portals/01-Rider-App.md` | Developers | Views, modals, GPS, OTP, offline queue |
| `docs/01-portals/01-SuperAdmin.md` | Developers | Tabs, TOTP, RBAC, onboarding |
| `docs/01-portals/01-SupremeAdmin.md` | Developers | Tabs, dual Firebase, REST API |
| `docs/02-bot/02-Multi-Tenant-Bot-Engine.md` | Developers | State machine, registry, session cache |
| `docs/02-bot/02-Order-Status-Monitor.md` | Developers | 8 status handlers, dedup, broadcasts |
| `docs/02-bot/02-Roshani-Pizza-Bot-Legacy.md` | Developers | 1929L monolith, 24 screens, Redis, Capacitor |
| `docs/03-foundation/03-Shared-Utilities.md` | Developers | 6 utility modules, caching, delivery math |
| `docs/03-foundation/03-Config-and-Theme-Tokens.md` | Developers | Constants, Firebase config, 4-app palettes |
| `docs/03-foundation/03-Database-Security-Rules.md` | Developers | 348L database.rules, 59L storage.rules |
| `docs/03-foundation/03-Deployment-and-Hosting.md` | DevOps | Hosting targets, PM2, firebase.json |
| `docs/03-foundation/03-Connectivity-Map.md` | Developers | End-to-end wiring diagram |
| `docs/03-foundation/03-Mission-Service-Layer.md` | Developers | Service contracts, signatures, flows |
| `docs/03-foundation/03-Scripts-Diagnostics-and-Migration.md` | DevOps | Seed, migrate, audit, credential scripts |
| `docs/04-management/04-Business-Rules.md` | Product/Developers | Fee, pricing, coupon, commission specs |
| `docs/04-management/04-Security-and-RBAC.md` | Security/Developers | Auth methods, 2FA, 5-role RBAC, rules |
| `docs/04-management/04-Manuals-and-Knowledge-Base.md` | Everyone | This file — index of all documentation |

---

## 2. Firebase-Rules

N/A.

---

## 3. Database-Structure

N/A.

---

## 4. Connecting-Nodes

```
New team member onboarding:
  1. docs/00-master/00-INDEX.md → understand what exists
  2. docs/00-master/00-ARCHITECTURE.md → understand system structure
  3. docs/00-master/00-DATA-MODEL.md → understand data layout
  4. docs/03-foundation/03-Connectivity-Map.md → understand data flow
  5. docs/01-portals/01-<relevant-portal>.md → deep dive into specific app
  6. docs/04-management/04-Business-Rules.md → pricing/commission rules
  7. docs/04-management/04-Security-and-RBAC.md → security model

Product/feature planning:
  1. docs/01-portals/01-<portal>.md → understand existing features
  2. docs/Mission-Service-Layer.md → understand service contracts
  3. docs/00-master/00-DATA-MODEL.md → understand data impact
  4. docs/Data-Sync.md → understand multi-tenant invariants
```

---

## 5. Complete Flow: Using the Knowledge Base to Debug an Order Issue

1. Start at `docs/00-master/00-INDEX.md` → find relevant documents
2. Read `docs/03-foundation/03-Connectivity-Map.md` → understand order lifecycle nodes
3. Read `docs/00-master/00-DATA-MODEL.md` → find all RTDB paths touched by order
4. Read `docs/01-portals/01-Admin-Dashboard.md` → understand how admin processes orders
5. Read `docs/01-portals/01-Rider-App.md` → understand rider-side order flow
6. For order status transitions: `docs/02-bot/02-Order-Status-Monitor.md`
7. For pricing issues: `docs/04-management/04-Business-Rules.md`
8. For permission issues: `docs/04-management/04-Security-and-RBAC.md`
9. For rule rejection: `docs/03-foundation/03-Database-Security-Rules.md`
10. Cross-reference with existing `docs/Data-Sync.md` and `docs/FoodHubbie-Audit-Report.md` for known issues
