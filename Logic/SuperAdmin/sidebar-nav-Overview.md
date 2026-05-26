# SuperAdmin — Sidebar Navigation Overview

## Structure
```
.pro-sidebar (fixed left, 250px, z-index)
  ├─ .pro-logo: logo icon + "FOODHUBBIE PRO"
  ├─ <nav>: navigation links
  │   ├─ .nav-group-label: "Ecosystem Overview"
  │   ├─ .nav-link[data-tab="dashboard"]: "Ecosystem Overview"
  │   ├─ .nav-link[data-tab="onboarding"]: "Partner Requests" + #onboardingCount badge
  │   ├─ .nav-link[data-tab="reconciliation"]: "Financial Recon"
  │   ├─ .nav-link[data-tab="businesses"]: "Managed Entities"
  │   ├─ .nav-link[data-tab="outlets"]: "Outlet Profiles"
  │   ├─ .nav-link[data-tab="analytics"]: "Global Analytics"
  │   ├─ .nav-link[data-tab="riders"]: "Rider Management"
  │   ├─ .nav-link[data-tab="delivery"]: "Service Slabs"
  │   ├─ .nav-link[data-tab="inventory"]: "Inventory Control"
  │   ├─ .nav-link[data-tab="promotions"]: "Promotions Center"
  │   ├─ .nav-link[data-tab="users"]: "User Registry"
  │   ├─ .nav-group-label: "Growth & Engagement"
  │   ├─ .nav-link[data-tab="liveorders"]: "Live Orders"
  │   ├─ .nav-link[data-tab="reviews"]: "Ratings & Reviews"
  │   ├─ .nav-link[data-tab="broadcast"]: "Broadcast Center"
  │   ├─ .nav-group-label: "System Core"
  │   ├─ .nav-link[data-tab="audit"]: "Security Audit"
  │   ├─ .nav-link[data-tab="reports"]: "Ecosystem Reports"
  │   └─ .nav-link[data-tab="settings"]: "Infrastructure"
  └─ .pro-profile: avatar + name + role badge + logout icon
```

## Routing Mechanism
Navigation uses a `data-tab` attribute pattern with a single click handler (defined in main.js):

```javascript
// All nav-links share this click handler:
document.querySelectorAll('[data-tab]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const tab = this.dataset.tab;
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    
    // Update tab pane active state
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    
    // If already on this tab → skip reload
    if (document.getElementById('mainSurface').dataset.theme === tab) return;
    document.getElementById('mainSurface').dataset.theme = tab;
    
    // Update header
    // ... (tab-specific title + subtitle)
    
    // Load tab-specific data
    const loaders = {
      dashboard: 'initStats',
      onboarding: 'initOnboardingManager',
      reconciliation: 'loadReconciliations',
      businesses: 'loadBusinessesTab',
      outlets: 'loadOutletsTab',
      analytics: 'loadReports',
      riders: 'loadRiders',
      delivery: 'loadGlobalDelivery',
      inventory: 'loadInventory',
      promotions: 'loadPromotions',
      users: 'loadUsers',
      liveorders: 'loadLiveOrders',
      reviews: 'loadReviews',
      broadcast: 'loadBroadcastHistory',
      audit: 'loadAuditLogs',
      reports: 'loadReports',
      settings: 'loadInfrastructure; loadTFAStatus'
    };
    // Call the appropriate loader function
  });
});
```

## RBAC Tab Hiding
On login, `applyRBACRestrictions(role)` iterates all nav-links and hides tabs the role cannot access:

```javascript
function applyRBACRestrictions(role) {
  // Map of tab → allowed roles
  const accessMap = {
    dashboard: ['superadmin','admin','business','outlet','support'],
    onboarding: ['superadmin','admin','business'],
    reconciliation: ['superadmin','admin'],
    // ... etc
  };
  
  document.querySelectorAll('[data-tab]').forEach(link => {
    const tab = link.dataset.tab;
    if (!hasTabAccess(tab)) {
      link.style.display = 'none'; // Hide tab from sidebar
    }
  });
  
  // Also hide sensitive controls and update role badge
}
```

## Active State Management
- One nav-link has `.active` class at a time
- Active link: accent color, bold font, subtle background
- Default active: `dashboard` (first tab)
- `.active` moved to clicked link on tab switch
- Tab pane visibility tied to `.active` via CSS: `.tab-pane.active { display: block; }`

## Sidebar Styling
- Fixed position, 250px width, full height
- White background with right border
- Scrollable nav area (overflow-y: auto)
- Bottom section (profile) sticks to bottom via `margin-top: auto` (flexbox)
- nav-link hover: background change
- nav-link active: primary color accent
- nav-group-label: uppercase, muted, small font, top spacing

## Badge (#onboardingCount)
- Shows count of pending partner requests
- Hidden by default, shown when count > 0
- Orange badge with white text
- Updated by `initOnboardingManager()` real-time listener

## Profile Section
```
.pro-profile
  ├─ Avatar circle with initials (e.g., "SA" for SuperAdmin)
  ├─ Name text (hardcoded "Root Admin")
  ├─ "Master Session" subtitle
  ├─ Role badge (#adminRoleBadge, hidden by default, shown by applyRBACRestrictions)
  └─ Logout icon → auth.signOut() + location.reload()
```

## Edge Cases
- **Many tabs**: 17 tabs across 3 groups — sidebar scrolls if viewport too short
- **Limited role**: 5-10 tabs hidden for business/outlet/support roles — remaining tabs reflow
- **Mobile/responsive**: At 1024px breakpoint, sidebar collapses to icon-only (narrow width)
- **PWA install**: No install prompt in sidebar (unlike Rider App)
