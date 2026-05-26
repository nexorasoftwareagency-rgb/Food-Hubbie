# SuperAdmin — Complete Flows

## 1. Partner Onboarding Lifecycle

```
1. PARTNER SUBMITS REQUEST
   ├─ Partner fills onboarding form (external/marketplace)
   ├─ Data stored at: onboarding_requests/{uid}
   └─ Status: "pending"

2. ADMIN CHECKS QUEUE
   ├─ SuperAdmin Onboarding tab → initOnboardingManager()
   ├─ Real-time listener on onboarding_requests
   ├─ Table shows: name, email, KYC status, submitted date
   └─ Admin reviews request details

3. ADMIN APPROVES
   ├─ Tap "Approve" → approvePartner(uid)
   ├─ Read request data from onboarding_requests
   ├─ Create Firebase Auth account (secondaryAuth.createUser)
   ├─ Atomic provisioning:
   │   ├─ businesses/{bid}.set({ name, commission, ... })
   │   ├─ businesses/{bid}/outlets/{oid}.set({ name, slug, lat, lng, ... })
   │   ├─ system/admins/{newUid}.set({ email, role: 'business', ... })
   │   ├─ businesses/{bid}/outlets/{oid}/categories.set(defaultCategories)
   │   └─ slugs/outlets/{slug}.set({ bid, oid })
   ├─ Archive: onboarding_history/{uid}.set(request)
   ├─ Cleanup: onboarding_requests/{uid}.remove()
   ├─ Audit log: atomicAdminAction(..., 'PARTNER_APPROVED')
   └─ Toast: "Partner provisioned successfully"

4. ADMIN REJECTS
   ├─ Tap "Reject" → rejectPartner(uid)
   ├─ Show confirmation via SweetAlert2
   ├─ Remove: onboarding_requests/{uid}.remove()
   └─ (Optionally move to onboarding_history with status: rejected)

5. MANUAL PROVISIONING
   ├─ Tap "Provision Node" → shows inline form
   ├─ Admin enters: business name, slug, outlet name, slug, address, lat/lng, admin email, phone, password
   ├─ Form submit → same atomic pipeline as approvePartner
   └─ Admin email/password sent to partner
```

## 2. Financial Reconciliation Lifecycle

```
1. LOAD DATA
   ├─ Navigate to Financial Recon tab
   ├─ loadReconciliations():
   ├─ Read: businesses/{bid}/outlets/{oid}/settlements (all outlets)
   ├─ Aggregate into globalReconciliations array
   ├─ Apply filters: date range (from/to), status, outlet
   ├─ Compute KPIs:
   │   ├─ Total Volume → #reconGlobalRev
   │   ├─ Platform Commissions → #reconGlobalComm
   │   ├─ Pending Settlements → #reconGlobalPending
   │   └─ Total Settled → #reconGlobalSettled
   └─ Render transaction table with Status badges

2. SETTLE TRANSACTION
   ├─ Admin taps "Settle" on a PENDING row
   ├─ SweetAlert2 confirmation dialog
   ├─ On confirm:
   │   ├─ Transaction on businesses/{bid}/outlets/{oid}/wallet
   │   ├─ Push to businesses/{bid}/outlets/{oid}/ledger/{txId}
   │   ├─ Update settlement: status → "SETTLED", settledAt, settledBy
   │   └─ Audit log: atomicAdminAction(..., 'SETTLEMENT_PROCESSED')
   ├─ Toast: "Settlement completed"
   └─ Refresh table

3. EXPORT REPORT
   ├─ Admin taps "Export Sheet"
   ├─ Build CSV with headers: Ref ID, Date, Partner, Order Total, Commission, Rider Payout, Net Payout, Status
   ├─ Apply safeCSV() to all values
   ├─ Create Blob → download via URL.createObjectURL
   └─ Filename: `reconciliation_export_YYYY-MM-DD.csv`
```

## 3. Live Orders Pipeline (Table & Kanban)

```
1. LOAD LIVE ORDERS
   ├─ Navigate to Live Orders tab
   ├─ loadLiveOrders():
   ├─ Detach previous listener (_liveOrdersUnsub)
   ├─ Attach real-time listener on businesses
   ├─ Aggregate all orders across all outlets
   ├─ Filter: created within 48h + active statuses
   ├─ Sort: newest first
   └─ Render: pipeline metric cards + table OR kanban

2. TABLE VIEW
   ├─ Columns: Order ID, Outlet, Customer, Items, Amount, Status, Age, Rider, Actions
   ├─ Age column: time elapsed with color coding (green < 15min, yellow 15-30min, red > 30min)
   ├─ SLA alerts: Orders pending > 30min get red row + alert banner
   └─ Action: "Update Status" button → dropdown → SweetAlert2 confirm → atomic update

3. KANBAN VIEW
   ├─ Columns: New/Pending → Preparing → Out for Delivery → Delivered
   ├─ Cards draggable between columns (HTML5 Drag and Drop API)
   ├─ handleOrderDragStart(): stores dragged order ID
   ├─ handleOrderDrop(e, newStatus):
   │   ├─ Map drop zone to new status
   │   ├─ Update order status in Firebase
   │   ├─ Refresh kanban board
   │   └─ Audit log
   ├─ Overdue cards: red left border
   └─ View toggle persisted in localStorage

4. FILTER
   ├─ Pipeline metric cards: filter by status category
   ├─ Outlet dropdown: filter by specific outlet
   └─ Refresh button: manual reload
```

## 4. Data Retention Lifecycle

```
1. ADMIN CONFIGURES POLICY
   ├─ Navigate to Infrastructure tab → Data Retention section
   ├─ Select retention period: 30/60/90/180/365 days
   ├─ Select action: Archive or Purge
   └─ Three independent policies: Orders, Audit Logs, Settlements

2. APPLY ORDERS RETENTION
   ├─ applyDataRetention('orders')
   ├─ processRetentionOrders():
   │   ├─ Iterate all businesses → outlets
   │   ├─ Query orders older than retention period
   │   ├─ For each order:
   │   │   ├─ Write to archives/orders/{bid}/{oid}/{year}/{month}/{orderId}
   │   │   └─ Remove from businesses/{bid}/outlets/{oid}/orders/{orderId}
   │   └─ Log: "Archived/purged X orders"
   └─ Show retention status toast

3. APPLY AUDIT RETENTION
   ├─ applyDataRetention('audit')
   ├─ processRetentionAudit():
   │   ├─ Process system/auditLogs entries older than period
   │   ├─ Process logs/marketplaceAudit entries
   │   ├─ Process logs/botAudit entries
   │   ├─ Archive to appropriate archives/ path
   │   └─ Remove from source
   └─ Show retention status toast

4. APPLY SETTLEMENTS RETENTION
   ├─ applyDataRetention('settlements')
   ├─ processRetentionSettlements():
   │   ├─ Iterate all businesses/outlets
   │   ├─ Query settlements with status "SETTLED" and age > period
   │   └─ Archive → remove
   └─ Show retention status toast
```

## 5. Broadcast Lifecycle

```
1. ADMIN COMPOSES
   ├─ Navigate to Broadcast Center tab
   ├─ Fill: title, body, select audience (5 types), select category (4 types), optional image URL
   ├─ Rate limit: max 1 broadcast per 60 seconds (SEND_BROADCAST)
   └─ Tap "Send Broadcast"

2. SYSTEM SENDS
   ├─ sendBroadcast():
   ├─ Validate required fields
   ├─ Check rate limit → if exceeded, toast "Please wait 60s"
   ├─ Push to system/broadcasts/{pushId}
   ├─ Audit log: atomicAdminAction(..., 'BROADCAST_SENT')
   └─ Toast: "Broadcast sent to {audience}"

3. DELIVERY
   ├─ Broadcasts stored for FCM topic messaging
   ├─ Stats tracked: total sent, this week count
   └─ History: last 20 broadcasts with title, audience, category, timestamp
```
