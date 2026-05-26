# SuperAdmin — Connecting Nodes

## Page Load Flow
```
1. index.html loads → Lucide + Firebase + OTPAuth + QRCode + Chart.js + SweetAlert2 CDNs
2. style.css applies design system
3. js/main.js loads:
   a. Firebase config + dual initializeApp()
   b. Global variable declarations
   c. onAuthStateChanged → checkAuth() → TFA gate → RBAC → main app
   d. Auth gateway (#loginOverlay) shown if no session
   e. Tab click handler bound to nav-links
   f. Onboarding form submit listener
```

## Tab Activation Flow
```
1. Admin clicks nav-link with data-tab="dashboard"
2. Tab click handler:
   a. Remove .active from all tabs → add .active to target pane
   b. Remove .active from all nav-links → add .active to clicked link
   c. Update header (#tabTitle, #tabSubtitle)
   d. If returning to same tab → skip reload
   e. Call corresponding load function:
      - "dashboard" → initStats()
      - "onboarding" → initOnboardingManager()
      - "reconciliation" → loadReconciliations()
      - "businesses" → loadBusinessesTab()
      - "outlets" → loadOutletsTab()
      - "analytics" → loadReports() (reuses reports data)
      - "riders" → loadRiders()
      - "delivery" → loadGlobalDelivery()
      - "inventory" → loadInventory()
      - "promotions" → loadPromotions()
      - "users" → loadUsers()
      - "liveorders" → loadLiveOrders()
      - "reviews" → loadReviews()
      - "broadcast" → loadBroadcastHistory()
      - "audit" → loadAuditLogs()
      - "reports" → loadReports()
      - "settings" → loadInfrastructure() + loadTFAStatus()
```

## Firebase → Render Flow (example: Dashboard)
```
initStats():
  1. db.ref('businesses').on('value', (snap) => {
       a. Count businesses → #countBusinesses.textContent
       b. Count outlets → #countOutlets.textContent
       c. Count orders (today) → #countOrdersToday.textContent
       d. Count users → #countCustomers.textContent
       e. Build heatmap → renderOrderHeatmap(orders)
       f. Build business table → renderBusinessList(bizList)
       g. Render sparklines → renderDashboardSparklines()
       h. Update lastSyncTime
       i. lucide.createIcons()
     })
```

## Firebase → Render Flow (example: Partner Approval)
```
initOnboardingManager():
  1. db.ref('onboarding_requests').on('value', (snap) => {
       a. Filter by status === "pending"
       b. Update #pendingCount, #approvedCount
       c. Build table rows with approve/reject buttons
       d. Set #onboardingTableBody.innerHTML
       e. lucide.createIcons()
     })

approvePartner(uid):
  1. Read onboarding_requests/{uid} for request data
  2. Secondary Firebase Auth → createUser({ email, password })
  3. db.ref('businesses/{bid}').set({ name, commission, ... })
  4. db.ref('businesses/{bid}/outlets/{oid}').set({ name, slug, lat, lng, email, phone, password, ... })
  5. db.ref('system/admins/{newUid}').set({ email, role: 'business', ... })
  6. db.ref('businesses/{bid}/outlets/{oid}/categories').set(defaultCategories)
  7. db.ref('slugs/outlets/{slug}').set({ bid, oid })
  8. db.ref('onboarding_history/{uid}').set(requestData)
  9. db.ref('onboarding_requests/{uid}').remove()
  10. atomicAdminAction(updates, 'PARTNER_APPROVED', { ... })
```

## Firebase → Render Flow (example: Live Orders)
```
loadLiveOrders():
  1. If _liveOrdersUnsub → call it to detach previous listener
  2. db.ref('businesses').on('value', (snap) => {
       a. Iterate all businesses → outlets → orders
       b. Filter orders in 48h window with active statuses
       c. Count by status pipeline → update metric cards
       d. Check SLA breaches (>30min pending) → render #slaAlerts
       e. If table view → renderOrderTable() with innerHTML on #liveOrdersBody
       f. If kanban view → renderOrderKanban() with columns on #kanbanContainer
       g. lucide.createIcons()
     })
```

## Write Operations Pattern
```javascript
// Most write operations follow this pattern:
function saveX() {
  1. Read input values from DOM
  2. Validate inputs
  3. Check rate limit (for sensitive operations)
  4. Build update object
  5. db.ref(path).set() or .update() or .transaction()
  6. logAdminAction(action, details)
  7. showToast('Success', 'success')
  8. lucide.createIcons()
}

// Atomic operations use:
atomicAdminAction(updates, action, details) {
  // Bundles multiple path updates + audit log in single multi-path update
  updates[`system/auditLogs/${pushId}`] = { timestamp, adminId, action, details };
  db.ref().update(updates);
}
```

## Real-time Listeners (3 total)
| Listener | Path | Attached At | Detached |
|---|---|---|---|
| Dashboard | `businesses` | `initStats()` | Never (always active) |
| Onboarding | `onboarding_requests` | `initOnboardingManager()` | Tab switch |
| Riders | `riders` | `loadRiders()` | Tab switch |
| Live Orders | `businesses` | `loadLiveOrders()` | Tab switch (via _liveOrdersUnsub) |

## Event Binding Summary
| Mechanism | Used For | Count |
|---|---|---|
| `onclick` in HTML | Tab nav, button actions, table actions | ~50+ |
| `oninput` | Search fields (filtering) | 3 |
| `onchange` | Dropdown filters | 4 |
| `onsubmit` + addEventListener | Login form, TFA form, onboarding form, broadcast form | 4 |
| `ondragstart` / `ondragover` / `ondrop` | Kanban order cards | 3 |
