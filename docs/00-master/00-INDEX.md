# Foodhubbie Documentation Index

Master index of all documentation files across the Foodhubbie SaaS ecosystem and the imported Roshani Pizza Bot. New files live in `docs/00..04/`; existing files in `docs/` are preserved and cross-referenced.

## docs/ (existing — preserved)

| File | Topic |
|---|---|
| `bot-multi-tenant.md` | Multi-tenant bot architecture freeze (PRs 13–16) |
| `bot-operations.md` | Bot operator's runbook: daily ops, tenant lifecycle, troubleshooting |
| `brand-tokens.md` | Per-app palette matrix, token format, tenant overrides |
| `data-sync.md` | Canonical RTDB tree, order lifecycle, multi-tenant invariants |
| `DEEP-AUDIT-PLAN.md` | Deep 100% audit & verification plan (Phases 0–10) |
| `FoodHubbie-Audit-Report.md` | Full codebase audit: 5 critical, 8 high, 4 medium issues |
| `FoodHubbie-Fixes.md` | Fixes applied from audit report |
| `generate.md` | Scripts reference: seeding, credentials, migration |
| `PHASE0-10-VERIFICATION-CHECKLIST.md` | Phase-by-phase verification checklist |
| `PHASE1..7-VERIFICATION-REPORT.md` | Phase 1–7 verification results |
| `RECOMMENDATIONS-PENDING.md` | Pending recommendations |
| `shopadmin-v2-parity.md` | v1→v2 feature parity audit |

## docs/00-master/ — Foundational Overview

| File | Covers |
|---|---|
| `00-INDEX.md` | **You are here** — master TOC of every docs file |
| `00-ARCHITECTURE.md` | C4 model: Context → Container → Component → Code. Deployment topology, data flow directions, app interdependencies |
| `00-DATA-MODEL.md` | Canonical Firebase Realtime Database tree. Every root node, every sub-collection, every field type. TS interfaces + JSON examples |

## docs/01-portals/ — 5 Portal Apps

| File | Covers |
|---|---|
| `01-Marketplace.md` | React 19/TS PWA: 11 pages, 4 contexts, 12 services, 6 component groups. Checkout flow, outlet discovery, cart engine, order tracking |
| `01-Admin-Dashboard.md` | React 19 SPA (App.jsx 3572L): 19 sections, 13 components, 4 utils, 1 hook, Firebase App Check, secondary auth, audit logger |
| `01-Rider-App.md` | Vanilla JS PWA (app.js 3031L): 7 views, 2-stage proximity gating, OTP system, GPS tracking, offline queue, PWA + FCM |
| `01-SuperAdmin.md` | Vanilla JS SPA (main.js 4038L): 17 tabs, TOTP 2FA, 5-role RBAC, Chart.js analytics, reconciliation engine, SweetAlert2 |
| `01-SupremeAdmin.md` | Vanilla JS SPA (app.js 2250L): 15 tabs, dual Firebase compat (RTDB+Firestore+Functions), Chart.js v4.4.7, lucide icons |

## docs/02-bot/ — WhatsApp Bot + Legacy

| File | Covers |
|---|---|
| `02-Multi-Tenant-Bot-Engine.md` | Single-socket multi-tenant bot: orchestrator, 11-step state machine, commands listener, audit logger, scheduled reports |
| `02-Order-Status-Monitor.md` | 8 status handlers, OTP generation, rider broadcast, admin notification, dedup map, tenant-scoped heartbeat |
| `02-Roshani-Pizza-Bot-Legacy.md` | Imported legacy monolith: Admin 18 screens, Rider 6 screens, original bot (1929L), Redis + in-memory cache, SheetJS/pdf export, dual-PM2, capacitor wrappers |

## docs/03-foundation/ — Shared Infrastructure

| File | Covers |
|---|---|
| `03-Shared-Utilities.md` | `shared/`: Haversine distance, delivery fee, JID formatting, OTP gen, shop hours, FCM push, Firebase helpers, cache TTL |
| `03-Config-and-Theme-Tokens.md` | `config/`: brand identity, SaaS limits, 4 app palettes, 2 tenant overrides, Firebase config, reCAPTCHA key |
| `03-Database-Security-Rules.md` | `database.rules.json` (30+ paths), `storage.rules`, App Check, .indexOn, tenant isolation invariants |
| `03-Deployment-and-Hosting.md` | 5 Firebase Hosting targets, .firebaserc, npm workspaces, EC2 PM2, build pipeline, QR setup, rollback strategy |
| `03-Connectivity-Map.md` | End-to-end wiring: Customer WhatsApp → Baileys → multi-tenant bot → RTDB → admin live-listener → rider FCM → GPS → settlement |
| `03-Mission-Service-Layer.md` | **Data Service Layer**: 12 Marketplace services + bot tenant helpers. Each with signature, RTDB path, audit emission |
| `03-Scripts-Diagnostics-and-Migration.md` | All 19 `scripts/` files + 20 `scratch/` tools. Seed, migrate, audit, peek, credential management |

## docs/04-management/ — Business & Security Rules

| File | Covers |
|---|---|
| `04-Business-Rules.md` | 9-status pipeline, coupon rules, delivery slabs, OTP rate limits, settlement rules, fulfillment methods, inventory deduction, auto-cancel window |
| `04-Security-and-RBAC.md` | 5-role RBAC matrix, 3-layer tenant isolation, XSS/CSV injection hardening, secondary auth, 2FA TOTP, App Check |
| `04-Manuals-and-Knowledge-Base.md` | Cross-reference of all `manuals/*.md`, `.agent/` rules, `skills/` resources, archive references. Maps each manual to its source code |

## docs/ ↔ Logic/ Cross-Reference

The `Logic/` directory (`D:\Foodhubbie\Logic\`) contains ~527 detailed per-page/per-module files (6 files each: Code-Logics, Decisions, Firebase-Rules, Database-Structure, Points, Complete-Flow). The new `docs/` structure provides higher-level portal and infrastructure overviews. Use this map to navigate between them:

| docs/ file | Logic/ counterpart(s) | Logic/ file count |
|---|---|---|
| `01-Marketplace.md` | `Logic/Marketplace/` — 6 root + 1 types + 66 pages + 4 contexts + 6 components + 4 config + 2 hooks + 2 lib | 91 |
| `01-Admin-Dashboard.md` | `Logic/Admin-Dashboard/` — 6 root + 2 config + 19 pages × 6 + `Discounts/` (6) + `Promotions/` (6) + `Page-Guide/` (6) | 140 |
| `01-Rider-App.md` | `Logic/Rider-App/` — 6 root + 42 views + 6 feature + 3 config | 57 |
| `01-SuperAdmin.md` | `Logic/SuperAdmin/` — 6 root + 102 views + 8 feature + 2 config + 3 supp | 121 |
| `01-SupremeAdmin.md` | `Logic/SupremeAdmin/` — 6 root + 90 tabs | 96 |
| `02-Multi-Tenant-Bot-Engine.md` | `Logic/Bot/` — 5 modules × 6 + 4 overviews + `Discount-Engine/` (6) + `Promotions/` (6) | 46 |
| `02-Order-Status-Monitor.md` | `Logic/Bot/Status-Monitor/` — 6 files | 6 |
| `02-Roshani-Pizza-Bot-Legacy.md` | `Logic/Bot/Discount-Engine/` (6) + `Logic/Bot/Promotions/` (6) — discount engine + promotions module (v4.14.8–v4.14.9). Admin-side: `Logic/Admin-Dashboard/Discounts/` (6) + `Logic/Admin-Dashboard/Promotions/` (6) + `Logic/Admin-Dashboard/Page-Guide/` (6) | 30 |
| `03-Shared-Utilities.md` | `Logic/Shared/` — 6 files | 6 |
| `03-Database-Security-Rules.md` | `Logic/Shared/03-Firebase-Database-Rules.md` | 1 |
| **Total** | — | **527** |

> Rule: Always read the relevant `Logic/` per-page files before making code changes to a specific page/module (per `Logic/README.md`). Use `docs/` for system-level understanding first, then drill into `Logic/` for implementation details.

## File Count

| Directory | Files |
|---|---|
| `docs/00-master/` | 3 |
| `docs/01-portals/` | 5 |
| `docs/02-bot/` | 3 |
| `docs/03-foundation/` | 7 |
| `docs/04-management/` | 3 |
| **New total** | **21** |
| Existing `docs/` | 18 |
| **Grand total** | **39** |
