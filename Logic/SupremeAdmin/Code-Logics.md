# SupremeAdmin — Code Logics

## Overview
SupremeAdmin is a single-page vanilla HTML/CSS/JS admin panel (3 files: 685-line index.html, 994-line style.css, 2209-line app.js). It manages 15 dashboard tabs for business operations including onboarding, orders, riders, users, promotions, settlements, inventory, reviews, broadcasts, audit, reports, and settings.

## Firebase SDK
- Version: Firebase v11.4.0 compat SDK (app, auth, database, firestore, functions)
- Firestore and Functions are imported but never used — only RTDB is utilized
- Auth: firebase.auth() with signInWithEmailAndPassword / signOut
- Database: firebase.database() exclusively for all data operations

## Authentication
1. auth.onAuthStateChanged() — shows/hides #authOverlay on auth state
2. Login form calls auth.signInWithEmailAndPassword(email, password)
3. Logout calls auth.signOut() via #btnLogout
4. No session persistence config (defaults to localStorage)
5. Rider auth uses REST API: identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}
6. Password resets use auth.sendPasswordResetEmail()
7. TFA is a custom TOTP implementation (broken — see Points)

## Real-Time Listeners (7 total)
- /businesses — initDashboard (never detached)
- /businesses — initBusinesses (never detached)
- /riders — initRiders
- /users — initUsers
- /system/promotions/coupons — loadCoupons()
- /system/settings/delivery/slabs — initDeliverySlabs
- /onboarding_requests — initOnboarding

No listener is ever detached — all persist for the app lifetime.

## CRUD Operations

### Business Lifecycle
- Create: approveOnboarding() (from onboarding request) / onboardingSave() (from provision modal)
- Read: initBusinesses() — real-time listener on /businesses
- Update Outlet: outletEditSave() — writes to businesses/{bid}/outlets/{oid}
- Update Commission: commissionSave() — writes to businesses/{bid}/commission

### Rider Management
- Create: riderSave() (add mode) — Firebase Auth REST + write to /riders/{uid}
- Read: initRiders() — real-time listener on /riders
- Update: riderSave() (edit mode) — writes to /riders/{uid}
- Delete: deleteRider() — removes /riders/{uid}
- Password Reset: resetRiderPassword() — sendPasswordResetEmail

### User Management
- Read: initUsers() — real-time listener on /users
- Wallet Credit: walletSave() — transaction on users/{uid}/wallet + push to walletHistory
- Wallet History: viewWalletHistory() — limitToLast(5) on walletHistory
- Password Reset: resetUserPassword() — sendPasswordResetEmail
- CSV Export: exportCSV() from rendered table DOM

### Orders
- Live Listen: initLiveOrders() — reads all orders across all businesses/outlets
- Status Update: updateOrderStatus() — writes to orders/{orderId}/status
- Settlement: settleOrder() — writes settlement record + audit log

### Promotions
- Surge Pricing: btnApplySurge() — writes to /system/promotions/surge
- Global Discount: btnApplyDiscount — NO HANDLER ATTACHED (broken)
- Platform Fee: btnSetPlatformFee — NO HANDLER ATTACHED (broken)
- Coupons CRUD: Create (couponSave), toggle (toggleCoupon), delete (deleteCoupon), pause all (btnPauseAllCoupons)

### Inventory
- Stock Adjust: adjustStock() — transaction on menu/{dishId}/stock with delta
- Toggle Availability: toggleAvailability() — writes menu/{dishId}/available

### Broadcast
- Send: btnSendBroadcast() — pushes to /system/broadcasts with rate limiting (5/min)
- History: loadBroadcastHistory() — loads last 50 broadcasts

### Audit
- Read: initAudit() — aggregates 4 paths (system/auditLogs, logs/marketplaceAudit, logs/botAudit, logs/riderErrors)
- Pagination: renderAuditPage(page) — 50 per page

### Data Retention
- Execute: runRetention(type) — archives then removes records based on age (days parameter)
- Types: orders, audit logs, settlements
- Actions: archive (copy to /archives/) or purge (delete directly)

### Reports
- Computation: Iterates all orders across all businesses, aggregates daily revenue
- CSV Export: From rendered table DOM
- PDF Export: Uses html2pdf.js library

## Chart.js Integration
- revenueChart (Dashboard) — Line, 14-day daily revenue
- ordersChart (Dashboard) — Doughnut, order status counts
- reportsChart (Reports) — Line, all-time daily revenue
- dailyRevenueTrendChart (Reports) — ORPHANED, no JS writes to it

## Tab Navigation System
- showTab(tabName) — hides all .tab-content divs, shows target ($('tab-' + tabName)), calls init function
- initMap keys match data-tab values: liveorders, delivery, dashboard, etc.

## Fixed Bugs
1. ~~CRITICAL: showTab() ID mismatch — content divs use tab- prefix~~ **FIXED**
2. ~~HIGH: initMap key mismatch for live-orders and delivery-slabs~~ **FIXED**
3. ~~HIGH: Live Orders view toggle and status filter query non-existent classes~~ **FIXED**
4. ~~HIGH: btnApplyDiscount and btnSetPlatformFee have no event handlers~~ **FIXED**
5. ~~HIGH: generateTOTP() returns "000000" — TFA verification is a stub~~ **FIXED** (now computes proper TOTP via crypto.subtle)
6. ~~MEDIUM: Wallet history modal queries .wallet-history-list but HTML has tbody#walletHistoryBody~~ **FIXED**
7. ~~MEDIUM: Onboarding table: 6-col header vs 9-col rendered rows~~ **FIXED**
8. ~~MEDIUM: btnFilterSettlements has no click handler~~ **FIXED**
9. ~~MEDIUM: btnSaveDeliveryFlow has no handler~~ **FIXED**
10. ~~LOW: Extra /div in Reports section breaks content scope~~ **FIXED**
