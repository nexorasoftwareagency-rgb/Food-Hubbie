# Foodhubbie — Deep 100% Audit & Verification Plan

> **Status:** 📜 HISTORICAL — Superseded by `docs/00-master/00-INDEX.md` (master TOC) + `Logic/` (per-page specs)  
> **Date:** May 21, 2026  
> **Scope:** Complete platform verification — every file, every flow, every button, every cross-app integration  
> **Format:** Code-Logics · Firebase-Rules · Database-Structure · Connecting-Nodes · Complete-Flows  
> **See also:** `docs/00-master/00-INDEX.md` (current master TOC)

---

## Executive Summary

This plan covers a complete end-to-end verification of the Foodhubbie SaaS platform across all 4 portals (Marketplace, ShopAdmin, RiderApp, SuperAdmin), the WhatsApp Bot, shared services, Firebase security rules, and deployment configuration. The goal is to verify that every line of code works correctly, every user flow is complete, every button navigates properly, and all cross-app integrations sync in real-time.

---

## Phase 0: What's Already Done ✅

### Completed Fixes (from audit report)
- **CRIT-1:** Plaintext credentials removed from git history ✅
- **CRIT-2:** Storage rules `isOutletRestricted` logic fixed ✅
- **CRIT-3:** `marketplaceAudit` write restricted to authenticated users ✅
- **CRIT-4:** `superAdmin` node read restricted to superadmins ✅
- **CRIT-5:** Hardcoded email bypass removed (needs verification) ✅

### Completed Features
- **RiderApp Two-Stage Proximity Gates:** 1000m accept, 300m pickup ✅
- **Login UI Redesign:** All 4 portals (ShopAdmin, SuperAdmin, RiderApp) ✅
- **SuperAdmin Fixes:** HTML structure, "Node Not Found", autocomplete, icon errors ✅
- **Fulfillment Methods:** Delivery/Dine-in/Takeaway checkout flow ✅ (just deployed)
- **Bot Architecture Audit:** Split updateOutlet function, wallet modal, ServerValue refs ✅

### Pending from Original Audit (need verification)
- **HIGH-2:** `walletService.ts` — `db` import (verify if fixed)
- **HIGH-3:** `menuService.ts` — `isAvailable` boolean mapping (verify if fixed)
- **HIGH-4:** `OrderContext` — Firebase-backed order loading (verify if fixed)
- **HIGH-6:** Wallet debit race condition (verify if fixed)
- **HIGH-7:** Coupon increment timing (verify if fixed)
- **HIGH-8:** Status pipeline unification (verify if fixed)
- **MED-1:** Dual outlet schema migration (verify completion)
- **MED-2:** AuthContext race condition (verify if fixed)
- **MED-3:** Cart persistence `appliedCoupon` dependency (verify if fixed)
- **MED-4:** `walletHistory` vs `recentTransactions` field name (verify if fixed)
- **ERR-3:** Menu fallback logic (verify if fixed)
- **ERR-4:** Bot session cache TTL (verify if fixed)
- **LOW-1:** `.firebaserc` file (verify if exists)
- **LOW-2:** NPM workspaces list (verify if fixed)
- **LOW-3:** App Check / reCAPTCHA configuration (verify status)
- **LOW-4:** Dev scripts cleanup (verify if moved)
- **LOW-5:** Checkout null-check ordering (verify if fixed)
- **LOW-7:** Doc artifacts cleanup (verify if moved)

---

## Phase 1: Architecture & Security Audit 🔒

### 1.1 Firebase Security Rules Verification
- [ ] Verify `database.rules.json` — all paths have correct read/write permissions
- [ ] Verify `storage.rules` — all paths have correct access controls
- [ ] Test tenant isolation: Can outlet A read outlet B's data?
- [ ] Test user isolation: Can user A read user B's profile?
- [ ] Test admin elevation: Can regular admin access superadmin-only paths?
- [ ] Verify legacy paths (`Pizza-Shop`, `Cake-Shop`) are read-only
- [ ] Verify `logs/marketplaceAudit` requires authentication
- [ ] Verify `superAdmin` node is not publicly readable
- [ ] Check for any `.read: true` or `.write: true` that shouldn't exist

### 1.2 Firebase Configuration
- [ ] Verify `firebase.json` — all hosting targets configured correctly
- [ ] Verify `.firebaserc` exists and has correct project/target mappings
- [ ] Verify App Check configuration (reCAPTCHA keys)
- [ ] Verify Firebase project settings match production environment
- [ ] Check Firebase Authentication settings (sign-in methods, email verification)

### 1.3 Environment & Secrets
- [ ] Verify no credentials in source code (search for passwords, API keys, tokens)
- [ ] Verify `.gitignore` includes all sensitive files
- [ ] Check `Credential.md` is completely purged from git history
- [ ] Verify environment variables are used where appropriate
- [ ] Check for any hardcoded Firebase config that should be environment-based

---

## Phase 2: Marketplace Audit (React/TypeScript PWA) 🛒

### 2.1 Authentication Flow
- [ ] Google Sign-In works correctly
- [ ] Redirect handling after Google auth
- [ ] Auth state persistence across page reloads
- [ ] Logout clears all state and redirects
- [ ] Protected routes redirect to login when unauthenticated
- [ ] User profile loads correctly after login
- [ ] Saved addresses load and display correctly
- [ ] Wallet balance displays correctly

### 2.2 Home Page
- [ ] Hero section renders correctly
- [ ] Search functionality works
- [ ] Outlet listing displays correctly
- [ ] Outlet cards show correct data (name, rating, cuisine, delivery time)
- [ ] Clicking an outlet navigates to outlet detail page
- [ ] Loading states display while data fetches
- [ ] Error states display on fetch failure
- [ ] Empty states display when no outlets found

### 2.3 Outlet Detail Page
- [ ] Outlet info displays correctly (name, rating, cuisine, delivery time, address)
- [ ] Menu categories display correctly
- [ ] Menu items display with correct data (name, price, image, description, availability)
- [ ] Search within menu works
- [ ] Filter by category works
- [ ] Add to cart works correctly
- [ ] Item customization (if applicable) works
- [ ] Out-of-stock items show correct UI
- [ ] Surge pricing displays correctly
- [ ] Global discount displays correctly

### 2.4 Cart Flow
- [ ] Add to cart updates cart state
- [ ] Cart count badge updates
- [ ] Cart page displays all items correctly
- [ ] Quantity increment/decrement works
- [ ] Remove item from cart works
- [ ] Cart total calculates correctly (subtotal + delivery + tax - discounts)
- [ ] Delivery fee calculates correctly based on distance
- [ ] Coupon apply works
- [ ] Coupon remove works
- [ ] Coupon validation (expired, min order, max discount) works
- [ ] Global discount applies correctly
- [ ] Surge pricing applies correctly
- [ ] Cart persists across page reloads
- [ ] Cart clears after order placement
- [ ] Empty cart displays correct UI

### 2.5 Checkout Flow (NEW Fulfillment Methods)
- [ ] **Delivery:** Address form displays, validation works, saved address picker works
- [ ] **Dine-in:** Table number + guests form displays, validation works
- [ ] **Takeaway:** Pickup time form displays, validation works
- [ ] Fulfillment method selector switches correctly
- [ ] Delivery fee skipped for Dine-in/Takeaway
- [ ] Order summary updates based on fulfillment type
- [ ] Payment method selection works (UPI, Card, Wallet, COD)
- [ ] Wallet payment validates balance before order
- [ ] Wallet debit happens BEFORE order creation (race condition fix)
- [ ] Order placement creates correct Firebase record
- [ ] Order includes correct `type` field (delivery/dinein/takeaway)
- [ ] Order includes correct delivery address fields based on type
- [ ] Coupon applies correctly at checkout
- [ ] Global discount applies correctly at checkout
- [ ] Cashback bonus credits correctly after order
- [ ] Redirect to tracking page after order placement
- [ ] Loading state displays during order placement
- [ ] Error handling displays on order failure
- [ ] Wallet refund on order failure works

### 2.6 Order Tracking
- [ ] Tracking page displays order details correctly
- [ ] Order status updates in real-time
- [ ] Status pipeline displays all 8 stages correctly
- [ ] Status icons match each stage
- [ ] Status messages are correct for each stage
- [ ] Rider info displays when assigned
- [ ] Rider location updates in real-time (if applicable)
- [ ] Estimated delivery time displays
- [ ] Order history loads from Firebase (not localStorage)
- [ ] Order history displays correct data
- [ ] Reorder functionality works (if implemented)

### 2.7 User Profile
- [ ] Profile page displays user info correctly
- [ ] Wallet balance displays correctly
- [ ] Wallet history displays correctly
- [ ] Saved addresses CRUD works (add, edit, delete, select default)
- [ ] Order history displays correctly
- [ ] Notification preferences work (if implemented)
- [ ] Logout works correctly

### 2.8 Performance & UX
- [ ] Page load times are acceptable (<3s)
- [ ] Bundle size is optimized (check build output)
- [ ] Images are optimized (lazy loading, proper formats)
- [ ] Caching works correctly (service worker, HTTP cache)
- [ ] PWA install prompt works (if implemented)
- [ ] Offline fallback works (if implemented)
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility (a11y) basics: alt text, ARIA labels, keyboard navigation

---

## Phase 3: ShopAdmin Audit (Vanilla JS/CSS) 🏪

### 3.1 Authentication Flow
- [ ] Email/password login works
- [ ] Login form validation works
- [ ] Custom claims check for admin elevation (no hardcoded emails)
- [ ] Session persistence works
- [ ] Logout clears session and redirects
- [ ] Protected routes redirect to login when unauthenticated

### 3.2 Dashboard
- [ ] Dashboard loads with correct data
- [ ] Today's orders count is correct
- [ ] Today's revenue is correct
- [ ] Pending orders count is correct
- [ ] Charts/graphs display correctly (if implemented)
- [ ] Real-time updates work

### 3.3 Order Management
- [ ] Orders list displays correctly
- [ ] Real-time order updates work (new orders appear instantly)
- [ ] Order details display correctly
- [ ] Status update workflow works (Placed → Confirmed → Preparing → Cooked → Ready → Out for Delivery → Reached Drop Location → Delivered)
- [ ] Status pipeline matches canonical 8-stage pipeline
- [ ] Order assignment to rider works
- [ ] Order search/filter works
- [ ] Order receipt printing works (if implemented)
- [ ] Legacy path listeners are properly detached (HIGH-5 fix)

### 3.4 Menu Management
- [ ] Menu items list displays correctly
- [ ] Add new menu item works
- [ ] Edit menu item works
- [ ] Delete menu item works
- [ ] Toggle availability works
- [ ] Stock management works
- [ ] Category management works
- [ ] Menu changes reflect in Marketplace in real-time

### 3.5 Inventory Management
- [ ] Inventory list displays correctly
- [ ] Stock updates work
- [ ] Low stock alerts work (if implemented)
- [ ] Inventory changes reflect in menu availability

### 3.6 Analytics & Reports
- [ ] Sales reports display correctly
- [ ] Order history displays correctly
- [ ] Revenue calculations are correct
- [ ] Date range filters work
- [ ] Export functionality works (if implemented)

### 3.7 Settings
- [ ] Store settings update correctly
- [ ] Delivery radius/settings update
- [ ] Business hours update
- [ ] Notification settings work
- [ ] Profile settings work

---

## Phase 4: RiderApp Audit (Vanilla JS/CSS) 🚴

### 4.1 Authentication Flow
- [ ] Email/password login works
- [ ] Login form validation works
- [ ] Session persistence works
- [ ] Logout clears session and redirects
- [ ] Protected routes redirect to login when unauthenticated
- [ ] App Check errors handled gracefully (already implemented)

### 4.2 Order Acceptance
- [ ] New order notifications appear in real-time
- [ ] Order details display correctly
- [ ] **Proximity Gate 1:** 1000m check for order acceptance works
- [ ] Distance calculation is accurate
- [ ] Accept/Reject order works
- [ ] Accepted orders appear in active orders list

### 4.3 Order Fulfillment
- [ ] Navigate to shop works (map/directions)
- [ ] **Proximity Gate 2:** 300m check for pickup works
- [ ] Mark as picked up works
- [ ] Navigate to customer works
- [ ] Mark as delivered works
- [ ] Order status updates sync to Marketplace and ShopAdmin
- [ ] Delivery proof (photo/signature) works (if implemented)

### 4.4 Rider Profile & Stats
- [ ] Profile displays correctly
- [ ] Delivery history displays
- [ ] Earnings display correctly
- [ ] Rating displays correctly
- [ ] KYC status displays
- [ ] Online/offline toggle works

### 4.5 Real-time Sync
- [ ] Order status updates sync correctly across all apps
- [ ] Location updates work (if implemented)
- [ ] Notification delivery works

---

## Phase 5: SuperAdmin Audit (Vanilla JS/CSS) 👑

### 5.1 Authentication Flow
- [ ] Email/password login works
- [ ] Login form validation works
- [ ] Superadmin claim check works
- [ ] Session persistence works
- [ ] Logout clears session and redirects

### 5.2 Dashboard
- [ ] Global stats display correctly (total businesses, outlets, orders, revenue)
- [ ] Real-time updates work
- [ ] Charts/graphs display correctly
- [ ] Recent activity feed works

### 5.3 Business Management
- [ ] Business list displays correctly
- [ ] Add new business works
- [ ] Edit business works
- [ ] Delete/disable business works
- [ ] Business details display correctly
- [ ] Outlet management within business works

### 5.4 Outlet Management
- [ ] Outlet list displays correctly
- [ ] Add new outlet works
- [ ] Edit outlet works
- [ ] Delete/disable outlet works
- [ ] Outlet details display correctly
- [ ] "Node Not Found" error is fixed (uses dynamic outlet ID)
- [ ] HTML structure is correct (tab panes are siblings)

### 5.5 Rider Management
- [ ] Rider list displays correctly
- [ ] Add new rider works
- [ ] Edit rider works
- [ ] Delete/disable rider works
- [ ] KYC approval workflow works
- [ ] Rider assignment to outlets works

### 5.6 Promotions Center
- [ ] Surge pricing configuration works
- [ ] Global discount configuration works
- [ ] Coupon registry works (add, edit, delete, activate/deactivate)
- [ ] Coupon validation rules work

### 5.7 Reports Center
- [ ] Global sales analytics display correctly
- [ ] Performance leaderboards work
- [ ] Date range filters work
- [ ] Export functionality works

### 5.8 Onboarding Portal
- [ ] Self-service partner onboarding works
- [ ] Automated infrastructure provisioning works
- [ ] Email notifications work

---

## Phase 6: WhatsApp Bot Audit 🤖

### 6.1 Bot Engine
- [ ] Bot connects to WhatsApp successfully
- [ ] Session management works
- [ ] **Session cache TTL:** Memory leak fix verified (ERR-4)
- [ ] Message handling works correctly
- [ ] Order flow via WhatsApp works end-to-end

### 6.2 Order Flow
- [ ] Welcome message displays
- [ ] Outlet selection works
- [ ] Menu browsing works
- [ ] Cart management works
- [ ] Checkout flow works
- [ ] Payment confirmation works
- [ ] Order confirmation message sends
- [ ] Order status updates send via WhatsApp

### 6.3 Bot Configuration
- [ ] Bot mode (GLOBAL vs OUTLET) works correctly
- [ ] Bot order path is correct for current mode
- [ ] Bot session persistence works
- [ ] Bot error handling works

---

## Phase 7: Cross-App Integration Testing 🔗

### 7.1 Order Status Synchronization
- [ ] Order placed in Marketplace → appears in ShopAdmin instantly
- [ ] ShopAdmin updates status → Marketplace tracking updates instantly
- [ ] ShopAdmin assigns rider → RiderApp receives order
- [ ] Rider accepts → ShopAdmin and Marketplace update
- [ ] Rider picks up → ShopAdmin and Marketplace update
- [ ] Rider delivers → ShopAdmin and Marketplace update
- [ ] All 8 status stages sync correctly across all apps

### 7.2 Fulfillment Method Sync
- [ ] Delivery order: All apps show correct type and address
- [ ] Dine-in order: All apps show table number and guest count
- [ ] Takeaway order: All apps show pickup time
- [ ] RiderApp handles non-delivery orders correctly (no delivery flow)

### 7.3 Menu Sync
- [ ] ShopAdmin updates menu → Marketplace reflects changes in real-time
- [ ] Stock changes sync correctly
- [ ] Availability toggles sync correctly
- [ ] Price changes sync correctly

### 7.4 User Data Sync
- [ ] User profile updates reflect across all apps
- [ ] Wallet balance updates correctly after orders
- [ ] Saved addresses sync correctly

### 7.5 Promotion Sync
- [ ] SuperAdmin creates coupon → Marketplace can apply it
- [ ] SuperAdmin sets surge pricing → Marketplace shows surge
- [ ] SuperAdmin sets global discount → Marketplace applies it

---

## Phase 8: Performance & Compatibility Audit ⚡

### 8.1 Performance
- [ ] Marketplace bundle size < 1MB (check build output)
- [ ] ShopAdmin loads in < 2s
- [ ] RiderApp loads in < 2s
- [ ] SuperAdmin loads in < 2s
- [ ] Firebase queries are optimized (no N+1 queries)
- [ ] Real-time listeners are properly detached on unmount
- [ ] Images are optimized (WebP, lazy loading)
- [ ] Caching strategy is effective

### 8.2 Compatibility
- [ ] Chrome (latest) — all apps
- [ ] Firefox (latest) — all apps
- [ ] Safari (latest) — all apps
- [ ] Edge (latest) — all apps
- [ ] Mobile Chrome — Marketplace, RiderApp
- [ ] Mobile Safari — Marketplace, RiderApp
- [ ] Tablet browsers — all apps

### 8.3 PWA Features (Marketplace)
- [ ] Service worker registers correctly
- [ ] Offline fallback works
- [ ] Install prompt displays
- [ ] App icon and splash screen work
- [ ] Push notifications work (if implemented)

---

## Phase 9: Deployment Verification 🚀

### 9.1 Firebase Hosting
- [ ] Marketplace: `https://foodhubbie.web.app` — loads correctly
- [ ] ShopAdmin: `https://foodhubbie-admin.web.app` — loads correctly
- [ ] RiderApp: `https://foodhubbie-rider.web.app` — loads correctly
- [ ] SuperAdmin: `https://foodhubbie-superadmin.web.app` — loads correctly
- [ ] All apps deploy without errors
- [ ] Firebase deploy commands work from root

### 9.2 Firebase Database
- [ ] Security rules deploy correctly
- [ ] Storage rules deploy correctly
- [ ] Database indexes are configured
- [ ] Data migration (if needed) completes successfully

### 9.3 WhatsApp Bot Deployment
- [ ] Bot runs on EC2 (or other server)
- [ ] Bot connects to WhatsApp
- [ ] Bot processes orders correctly
- [ ] Bot session persists across restarts

---

## Phase 10: Final Verification & Documentation 📋

### 10.1 Code Quality
- [ ] No console errors in any app
- [ ] No TypeScript errors in Marketplace
- [ ] No linting errors in any app
- [ ] No dead code (unused functions, imports, variables)
- [ ] Consistent code style across all apps
- [ ] Comments are meaningful and up-to-date

### 10.2 Documentation
- [ ] README.md is up-to-date
- [ ] Audit report is updated with current status
- [ ] Fixes document is updated with applied fixes
- [ ] API documentation (if any) is current
- [ ] Deployment guide is current

### 10.3 Git & Version Control
- [ ] All changes committed
- [ ] All changes pushed to GitHub
- [ ] Git history is clean (no large files, no secrets)
- [ ] Branch strategy is documented (if applicable)

---

## Execution Strategy

### Week 1: Critical Verification
- Phase 1: Architecture & Security Audit
- Phase 2: Marketplace Audit (focus on Checkout + Order Tracking)
- Verify all HIGH and CRIT fixes from original audit

### Week 2: Portal Audits
- Phase 3: ShopAdmin Audit
- Phase 4: RiderApp Audit
- Phase 5: SuperAdmin Audit

### Week 3: Integration & Performance
- Phase 6: WhatsApp Bot Audit
- Phase 7: Cross-App Integration Testing
- Phase 8: Performance & Compatibility Audit

### Week 4: Deployment & Finalization
- Phase 9: Deployment Verification
- Phase 10: Final Verification & Documentation
- Deploy all verified changes
- Update all documentation

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Firebase rules misconfiguration | Critical | Low | Test each path individually |
| Cross-app sync failures | High | Medium | Manual testing of each flow |
| Performance degradation | Medium | Low | Monitor bundle sizes, query times |
| Deployment failures | Medium | Low | Test deploy commands before pushing |
| Bot session crashes | High | Low | Verify TTL fix, monitor memory |

---

## Success Criteria

- [ ] All 10 phases completed with no critical issues
- [ ] All HIGH and CRIT fixes verified as working
- [ ] All cross-app integrations sync correctly
- [ ] All deployments successful
- [ ] Zero console errors in production
- [ ] All user flows work end-to-end
- [ ] Documentation is complete and current

---

*End of Deep 100% Audit & Verification Plan — Foodhubbie SaaS Platform*
