# SuperAdmin — Code Logics

## Overview
Enterprise CRM dashboard for Foodhubbie ecosystem management. Vanilla JS SPA with Firebase v9.6.1 compat SDK. Green theme (#10B981).

## File Breakdown
| File | Lines | Purpose |
|---|---|---|
| `index.html` | 1766 | SPA shell — 17 tab panes, 8 modals, auth/2FA gateways |
| `style.css` | 674 | Enterprise design system (green theme) |
| `js/main.js` | 4038 | All application logic — 85+ functions, 30+ globals |

## Architecture
- **No framework** — pure vanilla JS, template literals for rendering
- **Global `window.*` pattern** — all functions on window for inline HTML `onclick`
- **Compatibility SDK** (`firebase-app-compat.js` 9.6.1) — no import/export
- **Dual Firebase instances** — primary for admin session, `SecondaryAuth` for creating partner/rider accounts
- **Lucide icons** — `lucide.createIcons()` called after every HTML injection

## Views (17 Tabs)
| # | Tab ID | Label | Nav Group |
|---|---|---|---|
| 1 | `dashboard` | Ecosystem Overview | Ecosystem Overview |
| 2 | `onboarding` | Partner Requests | Ecosystem Overview |
| 3 | `reconciliation` | Financial Recon | Ecosystem Overview |
| 4 | `businesses` | Managed Entities | Ecosystem Overview |
| 5 | `outlets` | Outlet Profiles | Ecosystem Overview |
| 6 | `analytics` | Global Analytics | Ecosystem Overview |
| 7 | `riders` | Rider Management | Ecosystem Overview |
| 8 | `delivery` | Service Slabs | Ecosystem Overview |
| 9 | `inventory` | Inventory Control | Ecosystem Overview |
| 10 | `promotions` | Promotions Center | Ecosystem Overview |
| 11 | `users` | User Registry | Ecosystem Overview |
| 12 | `liveorders` | Live Orders | Growth & Engagement |
| 13 | `reviews` | Ratings & Reviews | Growth & Engagement |
| 14 | `broadcast` | Broadcast Center | Growth & Engagement |
| 15 | `audit` | Security Audit | System Core |
| 16 | `reports` | Ecosystem Reports | System Core |
| 17 | `settings` | Infrastructure | System Core |

## Modals & Overlays (8)
| Element | Purpose |
|---|---|
| `#loginOverlay` | Auth gateway (email/password) |
| `#tfaModal` | TOTP 2FA verification (6-digit) |
| `#outletProfileModal` | Outlet read-only profile with analytics |
| `outletModal` (inline HTML) | Outlet edit form |
| `riderModal` (inline HTML) | Rider CRUD form with KYC |
| `couponModal` (inline HTML) | Coupon code generator |
| `walletModal` (inline HTML) | Wallet credit engine |
| `modalCommission` (inline HTML) | Commission edit |

## Key Global Variables
| Variable | Type | Purpose |
|---|---|---|
| `window.currentAdminRole` | string | RBAC role |
| `window.currentAdminData` | object | Admin DB record |
| `_rateLimitStore` | object | In-memory rate limiting |
| `_tfaSecret` / `_tfaTempSecret` | string|null | 2FA secrets |
| `allBusinessesList` | array | Cached businesses |
| `allRiders` | array | Cached riders |
| `allUsers` | object | Cached users |
| `allCoupons` | object | Coupon registry |
| `allLiveOrders` | array | Live orders |
| `allAuditLogs` | array | Unified audit logs |
| `globalInventory` | array | Inventory items |
| `globalReconciliations` | array | Settlement records |
| `PAGINATION` | object | `{ users, audit, businesses, riders }` page state |
| `revenueChartInstance` | Chart.js|null | Revenue chart handle |
| `_liveOrdersUnsub` | function|null | Live orders listener |

## Key Function Categories (~85 functions)
| Group | Count | Example Functions |
|---|---|---|
| Security/Auth | 6 | `doLogin()`, `checkAuth()`, `submitTFACode()` |
| RBAC | 4 | `applyRBACRestrictions()`, `hasPermission()` |
| Audit & Rate Limiting | 4 | `logAdminAction()`, `atomicAdminAction()`, `checkRateLimit()` |
| Navigation | 1 | Tab click handler (switch pane + load data) |
| 2FA | 5 | `loadTFAStatus()`, `showTFASetup()`, `verifyTFASetup()` |
| Data Retention | 3 | `applyDataRetention()`, `processRetentionOrders()` |
| Dashboard | 4 | `initStats()`, `renderSparkline()`, `renderOrderHeatmap()` |
| Businesses | 4 | `renderBusinessList()`, `loadBusinessesTab()` |
| Outlets | 6 | `loadOutletsTab()`, `showOutletProfile()`, `updateOutlet()` |
| Onboarding | 4 | `initOnboardingManager()`, `approvePartner()`, `rejectPartner()` |
| Delivery | 5 | `loadGlobalDelivery()`, `saveGlobalDelivery()`, `addDeliverySlab()` |
| Riders | 7 | `loadRiders()`, `saveRider()`, `compressImage()`, `deleteRider()` |
| Promotions | 10 | `saveSurge()`, `saveCoupon()`, `toggleCoupon()`, `exportCoupons()` |
| Users | 6 | `loadUsers()`, `processWalletCredit()`, `triggerPasswordReset()` |
| Reports | 3 | `loadReports()`, `renderRevenueChart()`, `exportReport()` |
| Audit | 2 | `loadAuditLogs()`, `renderUnifiedLogs()` |
| Live Orders | 10 | `loadLiveOrders()`, `renderOrderTable()`, `renderOrderKanban()`, `handleOrderDrop()` |
| Reviews | 3 | `loadReviews()`, `renderOutletScoreboard()` |
| Broadcast | 2 | `sendBroadcast()`, `loadBroadcastHistory()` |
| Inventory | 4 | `loadInventory()`, `quickAdjustStock()`, `toggleAvailability()` |
| Reconciliation | 5 | `loadReconciliations()`, `settleTransaction()`, `exportReconciliationReport()` |
| UI Utilities | 3 | `showToast()`, `paginateArray()`, `renderPagination()` |

## Rendering Pattern
```javascript
// 1. Load data from Firebase
// 2. Process/transform in memory
// 3. Build HTML string with template literals (safeText() for user data)
// 4. Set innerHTML on container element
// 5. Call lucide.createIcons() to render SVG icons
// 6. Bind any remaining event listeners
```

## Firebase Paths (30+)
| Path | Access Pattern | Used By |
|---|---|---|
| `businesses` | `on('value')`, `once('value')` | Dashboard, inventory, live orders, reviews, reports, reconciliation |
| `businesses/{bid}` | `update()` | Onboarding, updates |
| `businesses/{bid}/outlets/{oid}` | `read/write` | Outlet CRUD, editing |
| `businesses/{bid}/outlets/{oid}/orders` | `read/write` | Live orders, data retention, reports |
| `businesses/{bid}/outlets/{oid}/settlements` | `read/write` | Reconciliation |
| `businesses/{bid}/outlets/{oid}/wallet` | `transaction` | Settlement payout |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}` | `read/write` | Inventory |
| `businesses/{bid}/outlets/{oid}/reviews` | `read` | Reviews |
| `system/admins/{uid}` | `read/write` | Auth, TFA, RBAC |
| `system/admins` | `once('value')` | Business admin lookup |
| `system/auditLogs` | `push()`, `once('value')` | Audit logging, reports |
| `system/settings/delivery` | `read/write` | Delivery fee config |
| `system/promotions/surge` | `set()` | Surge pricing |
| `system/promotions/globalDiscount` | `set()` | Global discount |
| `system/promotions/coupons/{code}` | `read/write` | Coupons |
| `system/config/platformFee` | `set()` | Platform fee |
| `system/broadcasts/{key}` | `push()`, `once()` | Broadcast center |
| `system/settlements` | `once()` | Data retention |
| `onboarding_requests` | `on()`, `once()`, `remove()` | Partner approval |
| `onboarding_history/{uid}` | `set()` | Archival |
| `slugs/outlets/{slug}` | `set()` | Slug registry |
| `users` | `once('value')`, `on('value')` | User registry |
| `users/{uid}/walletBalance` | `transaction` | Wallet credit |
| `riders` | `on('value')`, `once('value')` | Rider management |
| `logs/marketplaceAudit` | `once()` | Audit console |
| `logs/botAudit` | `once()` | Audit console |
| `logs/riderErrors` | `once()` | Audit console |
| `archives/orders/...` | `set()` | Data retention |
| `archives/auditLogs/...` | `set()` | Data retention |
