# Shared Components — Complete Flow

## Flow: Full Authentication & Initialization

See `D:\Foodhubbie\Logic\Admin-Dashboard\06-Complete-Flows.md` Flow 1.

### Step-by-Step

```
1. User opens admin-dashboard (foodhubbie-admin.web.app)
   │
2. main.jsx renders <App /> in #root
   │
3. App mounts → onAuthStateChanged(auth, callback)
   │
4. [Loading state] — Shows FoodHubbie logo + spinner animation
   │
5a. [No user] — Renders login screen:
     ├── Full-screen orange gradient (bg: #E84908 → #D94400)
     ├── GlassCard with logo + "Welcome back"
     ├── Email + Password inputs
     ├── "Sign In" → signInWithEmailAndPassword(auth, email, password)
     └── No registration (accounts pre-created)

5b. [User authenticated] — Renders dashboard layout:
     ├── Read admins/{user.uid}:
     │     ├── businessId → _bizId global
     │     ├── outletId → _outletId global
     │     ├── outletName/outletAddress → outletInfo state
     │     └── setOutletContext(bizId, outletId)
     │
     ├── Sidebar: logo, outlet card, NAV_GROUPS, dark mode toggle, logout
     ├── Header: hamburger, page title, outlet name, bell, avatar
     ├── Main content: PAGES[page] rendered with { showToast, outletInfo }
     ├── Mobile bottom nav (5 items)
     └── Toast container (bottom-center)
```
