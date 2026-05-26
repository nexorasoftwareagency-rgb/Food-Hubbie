# SupremeAdmin — Connecting Nodes

## File Structure
SupremeAdmin is a 3-file vanilla SPA:
```
SupremeAdmin/
├── index.html   (685 lines)  — HTML structure, 15 tabs, modals, CDN imports
├── style.css    (994 lines)  — Design system, responsive layout, theme
└── app.js       (2209 lines) — All application logic, 79KB
```

No build system, no bundler, no TypeScript.

## External Dependencies (CDN)
| Library | Version | Purpose |
|---------|---------|---------|
| Firebase App | 11.4.0 compat | Firebase initialization |
| Firebase Auth | 11.4.0 compat | Admin authentication |
| Firebase Database | 11.4.0 compat | All data operations |
| Firebase Firestore | 11.4.0 compat | **Loaded but never used** |
| Firebase Functions | 11.4.0 compat | **Loaded but never used** |
| Chart.js | 4.4.7 | Revenue and order charts |
| html2pdf.js | (latest) | PDF export from Reports |
| Lucide | 0.468.0 | Icon set |

## Firebase Project
- Project: food-hubbie
- Firebase Config: Hardcoded in index.html (not imported from shared module)
- Auth Domain: food-hubbie.firebaseapp.com
- Database URL: https://food-hubbie-default-rtdb.firebaseio.com
- API Key: Exposed in HTML (used for REST calls)

## Relationship to Other Apps
| App | Data Shared | Integration |
|-----|------------|-------------|
| Marketplace | /users, /businesses, /orders, /system/promotions | Reads/writes same RTDB paths |
| Bot | /logs/botAudit, /businesses, /orders | Reads bot audit logs, manages orders |
| Rider App | /logs/riderErrors, /riders | Reads rider error logs |
| Admin Dashboard | /businesses, /orders, /users | Overlapping data but separate app |
| SuperAdmin | /businesses, /orders, /riders, /users | Similar scope but separate codebase |

## Key Differences from SuperAdmin
1. No build system (SuperAdmin is vanilla too, but different structure)
2. Green theme (#22C55E) vs SuperAdmin's green (#10B981)
3. No RBAC or secondaryAuth
4. Uses Firebase REST API for rider auth instead of secondaryAuth
5. Simplified TOTP (stub — always returns "000000")
6. 15 tabs vs SuperAdmin's 17 tabs
7. Kanban is basic (no drag-drop library, uses native HTML5 drag)
8. No TypeScript, no modules

## Data Flow
```
CDN Libraries → index.html (import) → app.js (initializes Firebase) → 
  auth.onAuthStateChanged → show #authOverlay or showTab("dashboard") →
  Tab click → showTab(tabName) → initMap[tabName]() → setup listeners/render →
  User actions → Firebase RTDB writes → Firebase event triggers → UI updates
```
