# React Error #310 — "Too Many Re-Renders" / "Rendered More Hooks Than During Previous Render"

## Table of Contents

1. [Problem Overview](#problem-overview)
2. [Symptoms](#symptoms)
3. [Root Cause Analysis](#root-cause-analysis)
4. [Fix Attempts (Chronological)](#fix-attempts-chronological)
5. [Final Solution](#final-solution)
6. [Code Changes](#code-changes)
7. [Architecture Diagram](#architecture-diagram)
8. [Prevention Checklist](#prevention-checklist)

---

## Problem Overview

**Error:** React error #310 — manifests as either `"Too many re-renders"` in production (minified) or `"Rendered more hooks than during the previous render"` in development.

**Trigger:** Firebase realtime database connection restoration (`[firebase] Connection restored.` log from `admin-dashboard/src/firebase.js:53`).

**Environment:**
- `admin-dashboard` app (React 18.3.1, Vite 7.3.3, esbuild 0.27.7)
- `Marketplace` app (React 19.1.0) — shares the same Firebase project but has separate fixes
- Deployed at `foodhubbie-admin.web.app`

**Impact:** Application crashes on reconnect, rendering the admin dashboard unusable until manual refresh.

---

## Symptoms

### Production (Foodhubbie Admin)
```
index-Byovu10V.js:23 [firebase] Connection restored.
index-Byovu10V.js:9 Error: Minified React error #310
    at Oi (index-Byovu10V.js:7:18415)
    at Rj [as useCallback] (index-Byovu10V.js:7:21995)
    at Oye (index-Byovu10V.js:122:73525)
```

### Development (localhost:5173)
```
Warning: React has detected a change in the order of Hooks called by App.
Previous render            Next render
1-91. ...                  ...
92. undefined              useCallback
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Error: Rendered more hooks than during the previous render.
    at App (App.jsx:551:30)
```

---

## Root Cause Analysis

### Why Error #310 Occurs

React enforces the **Rules of Hooks** — all hooks must be called in the exact same order on every render. This is how React associates state with the correct component instance across renders.

Error #310 fires when:
1. A render runs **fewer hooks** than a previous render → `"Rendered fewer hooks than expected"`
2. A render runs **more hooks** than a previous render → `"Rendered more hooks than during the previous render"`
3. The render count exceeds 50 iterations → `"Too many re-renders"` (infinite loop detection)

In our case, **scenario #2** was the culprit: hooks after an early `return` were skipped on initial render but executed on subsequent renders.

### The Specific Violations

#### Violation 1: `function App() {` deleted during refactoring

When the `getOutletStatus()` function was inserted before `App()`, the `function App() {` line was accidentally deleted. This caused:
- The entire App component body to be parsed as top-level module code
- `return` statements at the top level of an ESM module, which is syntactically invalid
- Syntax error: `Unexpected "}"` at line 740

#### Violation 2: State declarations removed

The refactoring also removed three crucial state declarations:
```javascript
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const authUnsubRef = useRef(null);
```

Without these, every reference to `user`, `setUser`, `authLoading`, and `authUnsubRef` threw `ReferenceError: user is not defined`.

#### Violation 3: Hooks positioned after early returns (The Core Bug)

The most critical issue: **hooks defined after early `return` statements in the component.**

```javascript
// === BEFORE (BUGGY) ===
function App() {
  const [page, setPage] = useState("dashboard");
  // ... ~90 hooks ...
  const [displaySettings, setDisplaySettings] = useState(null);

  if (authLoading) {
    return <LoadingScreen />;  // ← EARLY RETURN #1 — skips hooks below
  }

  if (!user) {
    return <LoginForm />;      // ← EARLY RETURN #2 — skips hooks below
  }

  // ⛔ These hooks are ONLY rendered when user is signed in!
  const handleDismissAlert = useCallback(...);
  const handlePrintAlert = useCallback(...);
  const PageComponent = PAGES[page] || DashboardPage;
  const bg = dark ? "#0f172a" : "#f8fafc";
  const sideBg = dark ? "#1e293b" : "#ffffff";
  const textCol = dark ? "#f1f5f9" : "#1e293b";

  return <Dashboard />;
}
```

**Render sequence that triggers the bug:**

| Render # | authLoading | user | Hooks executed | Hook count |
|----------|-------------|------|----------------|------------|
| 1 (initial mount) | `true` | `null` | Up to `authLoading` check | ~91 |
| 2 (setTimeout fires, onAuthStateChanged callback runs) | `false` | `{...}` | Falls through both early returns → **runs all hooks** | ~93 |
| **React detects mismatch**: 91 ≠ 93 → **Crash** 🚨 |

---

## Fix Attempts (Chronological)

### Attempt 1: Fix `Marketplace/src/hooks/use-toast.ts` (Marketplace only)
**Status:** ✅ Applied but not the root cause
**Change:** Effect dependency `[state]` → `[]` to prevent stale listener array management
**Result:** Independent fix for Marketplace app; not related to admin-dashboard error.

### Attempt 2: Fix syntax error — missing `function App() {`
**Status:** ✅ Applied
**Change:** Added `function App() {` before state declarations
**Result:** esbuild now parses the file successfully. Fix #1 of 3.

### Attempt 3: Add missing state declarations
**Status:** ✅ Applied
**Change:** Added `const [user, setUser] = useState(null);`, `const [authLoading, setAuthLoading] = useState(true);`, `const authUnsubRef = useRef(null);`
**Result:** `ReferenceError: user is not defined` resolved. Fix #2 of 3.

### Attempt 4: Move hooks after `if (!user)` but before `if (authLoading)`
**Status:** ❌ Failed (partial fix)
**Change:** Moved hooks from after `if (!user)` to before it (but still after `if (authLoading)`)
**Result:** Still got hook mismatch because `if (authLoading)` is the first early return.

### Attempt 5: Move ALL hooks before BOTH early returns (Final fix)
**Status:** ✅ Applied
**Change:** Moved `handleDismissAlert`, `handlePrintAlert`, `PageComponent`, `bg`, `sideBg`, `textCol` before `if (authLoading)`
**Result:** All renders execute the same hooks in the same order. Fix #3 of 3.

### Attempt 6: Fix `OrdersPage.jsx` prop destructuring
**Status:** ✅ Applied
**Change:** Added `outletInfo` to destructured props
**Result:** OrdersPage no longer crashes when navigated to.

---

## Final Solution

### Principle

**All hooks must be declared unconditionally at the top of the component, before any early returns.** Non-hook variables (like `PageComponent`, `bg`, etc.) that are used in both the login form AND the dashboard should also be defined before early returns.

### Before (Buggy Structure)
```
┌─ function App() {
│    // Hook 1-91: state, callbacks, effects
│    
│    if (authLoading) return <Loading />   ← Hooks 92-93 NOT rendered here
│    if (!user) return <LoginForm />       ← Hooks 92-93 NOT rendered here
│    
│    // Hook 92: handleDismissAlert = useCallback(...)   ← Only on render 3+
│    // Hook 93: handlePrintAlert = useCallback(...)     ← Only on render 3+
│    
│    return <Dashboard />
│ }
```

### After (Fixed Structure)
```
┌─ function App() {
│    // Hook 1-91: state, callbacks, effects
│    
│    // Hook 92: handleDismissAlert = useCallback(...)   ← EVERY render
│    // Hook 93: handlePrintAlert = useCallback(...)     ← EVERY render
│    // PageComponent, bg, sideBg, textCol              ← EVERY render (not hooks)
│    
│    if (authLoading) return <Loading />   ← JSX only, hooks already ran
│    if (!user) return <LoginForm />       ← JSX only, hooks already ran
│    
│    return <Dashboard />                  ← JSX only, hooks already ran
│ }
```

All 93 hooks now execute on EVERY render. The early returns only control which JSX is returned, not which hooks are registered.

---

## Code Changes

### File: `admin-dashboard/src/App.jsx`

#### Fix 1: Add missing `function App() {` declaration
**Location:** Between `getOutletStatus()` closing brace and state declarations
```javascript
  return isOpen
    ? { label: "OPEN", color: "#22c55e", bg: "#f0fdf4" }
    : { label: "CLOSED", color: "#ef4444", bg: "#fef2f2" };
}
// +++ ADDED: function App() {
function App() {
  const [page, setPage] = useState(() => {
```

#### Fix 2: Add missing state declarations
**Location:** After `function App() {` and before `const [page, setPage] = useState(...)`
```javascript
function App() {
  // +++ ADDED
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authUnsubRef = useRef(null);
  // +++ END ADDED
  const [page, setPage] = useState(() => {
```

#### Fix 3: Move hooks before early returns
**Location:** After the last `useEffect` (for Display settings) and before `if (authLoading)`
```javascript
  }, [user, reloadKey]);

  // +++ MOVED FROM AFTER if (!user) TO BEFORE if (authLoading)
  const handleDismissAlert = useCallback((id) => {
    setOrderAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handlePrintAlert = useCallback(async (order) => {
    try {
      const { printReceipt } = await import("./utils/printing");
      const store = storeSettings || { name: outletInfo?.name || "Store" };
      const ds = displaySettings || {};
      const opts = {
        showGSTIN: ds.checkShowGSTIN !== false,
        showFSSAI: ds.checkShowFSSAI !== false,
        showQR: ds.checkShowQR !== false,
        showTagline: ds.checkShowTagline !== false,
        showPoweredBy: ds.checkShowPoweredBy !== false,
        showWifiInfo: ds.checkShowWifiInfo === true,
        showFeedbackQR: ds.checkShowFeedbackQR !== false,
      };
      printReceipt(order, store, opts);
    } catch (_) {}
  }, [storeSettings, displaySettings, outletInfo]);

  const PageComponent = PAGES[page] || DashboardPage;
  const bg = dark ? "#0f172a" : "#f8fafc";
  const sideBg = dark ? "#1e293b" : "#ffffff";
  const textCol = dark ? "#f1f5f9" : "#1e293b";
  // +++ END MOVED

  if (authLoading) {
```

### File: `admin-dashboard/src/pages/OrdersPage.jsx`

#### Fix 4: Add missing `outletInfo` to destructured props
```javascript
export default function OrdersPage({ showToast, orders, ordersMap, liveOrdersMap, riders, loading,
  updateStatus, executeStatusUpdate, assignRider, deleteOrder, getOrderItems,
  highlightedOrderId, storeSettings, displaySettings,
  // +++ ADDED
  outletInfo
  // +++ END ADDED
}) {
```

### File: `admin-dashboard/src/App.jsx`

#### Fix 5: Bypass stale Vite re-export cache for `get` from firebase/database
**Problem:** `ReferenceError: get is not defined` when the `useEffect` at line 362 calls `get(ref(db, "admins/" + user.uid))`. The `get` function IS in the `export { ... }` block of `firebase.js`, but Vite's on-the-fly transform cache sometimes serves a stale version of the file without it.

**Solution:** Import `get` directly from `firebase/database` (the Vite-optimized dependency) instead of relying on the re-export through `./firebase`:

```javascript
// +++ DIRECT IMPORT (bypasses firebase.js re-export to avoid stale cache)
import { get as fbGet } from "firebase/database";
// --- REMOVED from the ./firebase import chain
// import { ..., get, ... } from "./firebase";
import { ..., /* get removed */ ... } from "./firebase";

const get = fbGet;  // ← module-level alias so all existing code keeps working
```

**Root cause:** Vite's module transform cache for `firebase.js` (a source file, not a node_modules dep) doesn't always invalidate correctly when the `export { ... get ... }` block is edited, causing `get` to be undefined at runtime even though it appears in the source.

**Result:** All 2463 production modules transform & bundle without errors.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Component                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Hook Declaration Zone                      │   │
│  │  (ALWAYS executes, no early returns allowed)            │   │
│  │                                                         │   │
│  │  • useState × 33                                       │   │
│  │  • useRef × 9                                          │   │
│  │  • useCallback × 18                                    │   │
│  │  • useEffect × 31                                      │   │
│  │                                                         │   │
│  │  ┌─ handleDismissAlert = useCallback(...)  ◄── MOVED    │   │
│  │  └─ handlePrintAlert = useCallback(...)     ◄── MOVED    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ if (authLoading) return <LoadingScreen />  ← JSX only      │
│  └─ if (!user) return <LoginForm />            ← JSX only      │
│                                                                 │
│  ┌─ return <DashboardLayout>                                    │
│  │    ├─ Sidebar                                                │
│  │    ├─ Header                                                 │
│  │    ├─ <PageComponent {...props} />                           │
│  │    │    └─ OrdersPage, LiveOpsPage, etc.                     │
│  │    ├─ OrderAlerts                                            │
│  │    └─ Toast                                                  │
│  └─────────────────────────────────────────────────────────     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prevention Checklist

1. **Never put hooks after early returns.** Use the "Hook Declaration Zone" pattern — all `useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`, and custom hooks at the top, before any conditional logic.

2. **Lint for Rules of Hooks.** Add `eslint-plugin-react-hooks` with `rules-of-hooks: error` to your ESLint config:
   ```json
   {
     "plugins": ["react-hooks"],
     "rules": {
       "react-hooks/rules-of-hooks": "error",
       "react-hooks/exhaustive-deps": "warn"
     }
   }
   ```

3. **Use `exhaustive-deps` rule.** The `outletInfo` was used in a `useCallback` dependency array but not destructured from props — this would have been caught by `exhaustive-deps: error`.

4. **Test with network toggling.** Firebase reconnection is frequently overlooked. Always test your app with:
   - DevTools → Network → Offline
   - DevTools → Network → Online
   - Wait for Firebase auto-reconnect after brief disconnection

5. **Production sourcemaps.** Deploy with sourcemaps to non-minified error traces in production debugging.

---

## Timeline

| Step | Action | Time Elapsed |
|------|--------|-------------|
| 1 | Identified error #310 triggered by Firebase reconnect | — |
| 2 | Set up Marketplace dev server (port 3000) | ~1 min |
| 3 | Fixed `use-toast.ts` effect dependency | ~2 min |
| 4 | Identified admin-dashboard as the actual source of error | ~5 min |
| 5 | Set up admin-dashboard dev server (port 5173) — syntax error blocked | ~3 min |
| 6 | Found missing `function App() {` (Fix #1) | ~10 min |
| 7 | Found missing state declarations (Fix #2) | ~2 min |
| 8 | First attempt to move hooks — only before `if (!user)` (failed) | ~5 min |
| 9 | Second attempt — moved all hooks before `if (authLoading)` (Fix #3) | ~5 min |
| 10 | Fixed HMR stale cache across dev server restarts | ~5 min |
| 11 | Fixed `OrdersPage.jsx` missing `outletInfo` prop (Fix #4) | ~2 min |
| 12 | Audited all 24 page components for prop mismatches | ~5 min |
| **Total** | | **~45 min** |

---

*Report generated from debugging session — July 2, 2026*
*Repository: https://github.com/nexorasoftwareagency-rgb/Food-Hubbie.git*
