# ShopAdmin v2 — Feature Parity Audit

> **Status:** Active (Phase 1 stabilization)  
> **Audience:** Developers, product managers  
> **Last updated:** 2026-06-04  
> **Format:** Code-Logics · Firebase-Rules · Database-Structure · Connecting-Nodes · Complete-Flows  
> **See also:** `docs/01-portals/01-Admin-Dashboard.md` (canonical Admin Dashboard doc) · `Logic/Admin-Dashboard/` (per-page specs)

The project currently has **two ShopAdmin codebases**:

| Codebase | Path | Stack | Status |
|---|---|---|---|
| **admin-dashboard v2** | `admin-dashboard/` | React + Vite + Tailwind + Firebase modular | **canonical — shipping** |
| **Admin-Previous v1** | `Admin-Previous/` | Vanilla JS modules | **legacy — being archived** |

Phase 1 picks v2 as canonical (per product decision). v1 moves to `archive/Admin-Previous-legacy-v1/` (see PR 9).

This document tracks **which v1 capabilities v2 has, doesn't have, or has with a different shape**.

---

## Module-by-module comparison

| v1 module | v2 section | Status | Notes |
|---|---|---|---|
| `app.js` (router / shell) | `App.jsx` + `sections/*` | ✅ equivalent | React Router → tabbed sections |
| `catalog.js` (menu CRUD) | `Menu.jsx`, `Categories.jsx` | ✅ equivalent | Better separation; same RTDB paths |
| `customers.js` (CRM) | `Customers.jsx` | ✅ equivalent | |
| `orders.js` (live orders, KOT) | `Orders.jsx`, `Kitchen.jsx` | ✅ equivalent + improved | Kitchen display split out |
| `pos.js` (in-store billing) | `POS.jsx` | ✅ equivalent | |
| `printing.js` (browser print, store-specific) | `utils/printing.js` (PR 8) | ✅ re-implemented, multi-tenant | **Replaces v1 hardcoded "ROSHANI PIZZA/CAKES" branding** |
| `receipt-templates.js` (thermal HTML) | embedded in `utils/printing.js` | ✅ re-implemented | 80mm thermal template, dynamic store settings |
| `settings.js` (shop hours, fees) | `Settings.jsx` | ✅ equivalent | |
| `tracker.js` (live order map) | `LiveTracker.jsx` | ✅ equivalent | |

## v2 sections that **don't exist in v1** (net-new)

- `Analytics.jsx` — revenue / order trends
- `Feedback.jsx` — reviews / ratings inbox
- `Inventory.jsx` — stock level mgmt
- `LiveOps.jsx` — combined live-ops view
- `LostSales.jsx` — cancelled-cart recovery
- `Notifications.jsx` — push / SMS to customers
- `Partners.jsx` — partner network view
- `Riders.jsx` — rider roster
- `Settlements.jsx` — payout reconciliation

## Migration steps

1. **PR 8 (this)** — added `utils/printing.js` to v2 (the only v1 capability that was missing).
2. **PR 9** — move `Admin-Previous/` to `archive/Admin-Previous-legacy-v1/`.
3. **`firebase.json` `admin` hosting target** — already points to `admin-dashboard/dist` (line 33), so deployment is correct.
4. **Update `manuals/ShopAdmin-Manual.md`** (PR 11, **done 2026-06-01**) — the user-facing manual now refers to the React UI, with a v1-vs-v2 diff callout in §13 and pointers to `docs/shopadmin-v2-parity.md` and `admin-dashboard/src/utils/printing.js`.

## Risks

- **Differences in keyboard shortcuts / power-user flows** in v1 may be missed by old admins. Plan a side-by-side demo before cutover.
- **Theme palette** — v1 was a different visual style. v2 should be brought onto the shared Marketplace theme (per `docs/brand-tokens.md`) before public rollout.
- **Any v1-specific bug fixes** that were never ported need to be audited before archiving. (Suggest a 1-sprint overlap where v1 stays online read-only.)
