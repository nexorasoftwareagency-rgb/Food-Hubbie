# SupremeAdmin — Section & Utility Logics

## Core Utilities

### $(id) — Line 1
document.getElementById shorthand. Used everywhere for DOM access.

### showTab(tabName) — Line 77
- Hides all .tab-content divs (display: none)
- Shows target by $(tabName) — BUG: should be $("tab-" + tabName)
- Calls initMap[tabName]() if function exists
- Updates active nav link styling via .nav-link.active
- BUG: initMap keys don't match data-tab values (liveorders→live-orders, delivery→delivery-slabs)

### confirmAction(msg, callback) — Line 111
- Shows #confirmModal with message text
- Clones #btnConfirmYes to prevent handler stacking
- Wires cloned button's onclick to callback
- Cancel closes modal

### showToast(msg, type) — Line 130
- Creates toast div with type-based styling (success/error/info)
- Appends to #toastContainer
- Auto-removes after 3 seconds

### formatDate(ts) — Line 141
- Converts timestamp to en-IN locale string (DD/MM/YYYY, HH:MM:SS)

### timeAgo(ts) — Line 150
- Returns relative time: "Just now", "Xm ago", "Xh ago", "Xd ago"
- Falls back to formatDate() if >30 days

### escapeHtml(str) — Line 163
- XSS-safe HTML escaping via DOM textContent assignment

### exportCSV(headers, rows, filename) — Line 170
- Generates CSV with BOM for Excel compatibility
- Triggers download via anchor click

## Chart Utilities

### buildRevenueChart(dailyRevenue, canvasId) — Line 281
- Creates Line chart with gradient fill
- X-axis: dates, Y-axis: revenue in ₹
- Destroys previous instance via global revenueChartInstance
- No click/tooltip interactions

### buildOrdersChart(statusCounts) — Line 318
- Creates Doughnut chart with 7 status segments
- Different color per status
- Destroys previous instance via global ordersChartInstance

## Pagination System

### renderPagination(container, totalPages, page, callback) — Line 2137
- Generic pagination bar builder
- Renders First, Prev, page numbers, Next, Last
- Highlights current page
- Truncates with ellipsis for large page counts

### Page-Specific Renders
- renderBusinessesPage(page) — Line 536
- renderRidersPage(page) — Line 856
- renderUsersPage(page) — Line 1039
- renderAuditPage(page) — Line 1774

All follow same pattern: slice data array, render table rows, call renderPagination.

## Tab-Specific Utilities

### Business Filters
- filterBusinesses() — Line 518: searches by name, owner, email across rendered data

### Delivery Slabs
- renderSlabs() — Line 1475: renders slab rows from array
- showSlabEditor(idx) — Line 1500: prompt() based inline add/edit
- saveSlabs() — Line 1527: persists entire slabs array to RTDB

### Data Retention
- runRetention(type) — Line 2032: archives records older than specified days, then removes

### TFA Utilities
- loadTFAStatus() — Line 1907: checks admin's tfaSecret in system/admins
- generateTFASecret() — Line 1986: generates random base32 string
- generateTOTP(secret) — Line 1995: BUG — always returns "000000"
- base32Decode(s) — Line 2008: decodes base32 string to Uint8Array

### Broadcast
- loadBroadcastHistory() — Line 1716: loads last 50 broadcasts ordered by timestamp

### Coupons
- loadCoupons() — Line 1210: real-time listener on /system/promotions/coupons
