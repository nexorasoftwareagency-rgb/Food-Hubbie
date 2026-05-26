# SupremeAdmin — Complete Flows

## 1. Authentication Flow
1. Page loads → Firebase initializes → auth.onAuthStateChanged fires
2. If not authenticated: #authOverlay is displayed (login form)
3. Admin enters email + password → signInWithEmailAndPassword
4. On success: onAuthStateChanged fires again → hide overlay → showTab("dashboard")
5. If authenticated: directly showTab("dashboard")
6. Logout: signOut() → onAuthStateChanged fires → show overlay

## 2. Partner Onboarding Flow
1. Partner submits request via marketplace/website → onboarding_requests created
2. Admin navigates to Onboarding tab → initOnboarding() listens on /onboarding_requests
3. Table displays: businessName, ownerName, email, phone, address, outletName, date, actions
4. Admin clicks Approve → approveOnboarding():
   a. Creates business record at /businesses/{bid}
   b. Creates outlet record at /businesses/{bid}/outlets/{oid}
   c. Sets admin in /system/admins/{uid}
   d. Deletes onboarding request
   e. Shows success toast
5. Admin clicks Reject → removes onboarding request
6. Admin can also use "Provision New" modal to manually create business+outlet

## 3. Business Management Flow
1. Businesses tab loads → initBusinesses() listens on /businesses
2. Table shows: name, owner, email, phone, outlets, status
3. Admin can search via filterBusinesses()
4. Pagination: renderBusinessesPage() slices 20 per page
5. Edit Outlet: opens outletEditModal → fill form → outletEditSave()
6. Commission: opens commissionModal → set percent + fixedFee → commissionSave()
7. Real-time updates reflect immediately

## 4. Order Lifecycle Flow
1. Admin clicks Live Orders → tab initializes and loads all orders
2. Reads all orders across all businesses/outlets
3. Table view shows: orderId, business, customerName, total, status, time, actions
4. Kanban view shows drag-drop columns by status
5. Status update: dropdown → updateOrderStatus() writes to orders/{id}/status
6. View toggle and status filter work correctly

## 5. Rider CRUD Flow
1. Riders tab loads → initRiders() listens on /riders
2. Table: name, email, phone, status, actions (Edit, Delete, Reset Password)
3. Add Rider: riderModal (add mode) → fill form → riderSave():
   a. Creates Firebase Auth account via REST API (identitytoolkit)
   b. Writes rider data to /riders/{uid}
4. Edit: riderModal (edit mode) → riderSave() updates /riders/{uid}
5. Delete: confirmAction → deleteRider() removes /riders/{uid}
6. Reset Password: sendPasswordResetEmail to rider's email

## 6. Wallet Credit Flow
1. Users tab loads → initUsers() listens on /users
2. Admin finds user → clicks "Credit Wallet"
3. walletModal shows: userName, userEmail, amount input, reason
4. walletSave():
   a. Transaction on /users/{uid}/wallet (atomic increment)
   b. Push to /users/{uid}/walletHistory/{key}
    c. Shows success toast
5. Wallet History modal renders table with date, amount, type, description

## 7. Promotions Flow
1. Promotions tab loads → initPromotions() reads surge, discount, platform fee
2. **Surge Pricing**: Admin sets multiplier, threshold, time range → btnApplySurge()
3. **Global Discount**: Values displayed in inputs → btnApplyDiscount saves to RTDB
4. **Platform Fee**: Values displayed in inputs → btnSetPlatformFee saves to RTDB
5. **Coupons**: loadCoupons() listens on /system/promotions/coupons
   - Add: couponModal → couponSave() pushes new coupon
   - Toggle: toggleCoupon() flips active status
   - Delete: confirmAction → deleteCoupon()
   - Pause All: btnPauseAllCoupons() toggles all to inactive

## 8. Settlement Flow
1. Settlements tab reads all orders from all businesses
2. Table shows: orderId, business, outlet, amount, status, date
3. Filters: date range (from/to), status dropdown
4. filterSettlements() applies client-side filtering (btnFilterSettlements has no click handler)
5. Admin clicks "Settle" → settleOrder():
   a. Pushes settlement to businesses/{bid}/outlets/{oid}/settlements/
   b. Pushes to /system/auditLogs
   c. Updates order settlement status

## 9. Inventory Flow
1. Inventory tab reads menu items across all businesses/outlets
2. Table: dish name, price, category, stock, availability, actions
3. Stock adjust: +/- buttons → adjustStock() uses transaction for atomic increment
4. Toggle availability: toggleAvailability() flips boolean
5. Search filters menu items client-side

## 10. Broadcast Flow
1. Broadcast tab shows form: title, message, audience dropdown
2. Rate limiting: lastBroadcastTime check (5 second cooldown, 5 per minute)
3. btnSendBroadcast() pushes to /system/broadcasts/{key}
4. loadBroadcastHistory() loads last 50 broadcasts (ordered by timestamp desc)

## 11. Audit Flow
1. Audit tab loads → initAudit() sets up 4 listeners:
   - /system/auditLogs
   - /logs/marketplaceAudit
   - /logs/botAudit
   - /logs/riderErrors
2. All entries merged into single array, sorted by timestamp desc
3. Pagination: renderAuditPage() — 50 per page
4. Table: action, details, admin/type, timestamp

## 12. Reports Flow
1. Reports tab loads → initReports()
2. Computes: total revenue, orders count, avg order value, net platform revenue, partner payouts, take rate
3. Builds revenue chart from aggregated daily data
4. Top 10 outlets by revenue rendered as table
5. CSV Export: exportCSV() from rendered table DOM
6. PDF Export: html2pdf.js renders current tab content

## 13. Settings Flow
1. Settings tab loads → initSettings()
2. TFA Section:
   - loadTFAStatus() checks if admin has tfaSecret
   - If not set: "Enable 2FA" shows tfaSetupModal with generated secret
   - If set: "Disable 2FA" removes tfaSecret
    - Verification: generateTOTP() computes valid HMAC-SHA1 TOTP code
3. Data Retention Section:
   - Select type (orders/audit/settlements)
   - Enter days threshold
   - Select action (archive/purge)
   - runRetention() archives then removes matching records
