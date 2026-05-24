# FOODHUBBIE SAAS — RIDER DELIVERY APP (RiderApp Rebuild)
## MASTER PRD + COMPLETE PROMPT + TECH STACK

> **Project**: Foodhubbie SaaS Multi-Tenant Restaurant Platform  
> **Rider App**: Full React PWA replacing vanilla JS RiderApp v4.7.1  
> **Target Domain**: `foodhubbie-rider.web.app`  
> **Firebase Project**: `food-hubbie`  
> **Build Tool**: Claude Code (Anthropic)  

---

## 1. TECH STACK (Must Match Exactly)

| Layer | Technology | Version |
|---|---|---|
| **Framework** | React | 19.1.0 |
| **Language** | TypeScript | ~5.9.2 |
| **Bundler** | Vite | 6.3.5 |
| **Styling** | Tailwind CSS | 4.1.7 |
| **Animation** | tailwindcss-animate (tw-animate-css) | 1.4.0 |
| **Typography** | @tailwindcss/typography | 0.5.15 |
| **Vite Plugin React** | @vitejs/plugin-react | 4.5.2 |
| **Vite Plugin Tailwind** | @tailwindcss/vite | 4.1.7 |
| **Routing** | wouter (hash-based) | 3.3.5 |
| **State / Server State** | TanStack React Query | 5.80.6 |
| **Maps** | react-leaflet + leaflet | 1.9.4 |
| **UI Library** | shadcn/ui (Radix primitives) | Latest |
| **Charts** | recharts | 2.15.2 |
| **Date** | date-fns | 3.6.0 |
| **Icons** | lucide-react | 0.509.0 |
| **Notifications** | sonner | 2.0.7 |
| **Animations** | framer-motion | 12.9.4 |
| **Firebase** | firebase | ^12.13.0 |
| **Class Utils** | clsx + tailwind-merge + class-variance-authority | Latest |
| **Confetti** | canvas-confetti | 1.9.3 |
| **Forms** | react-hook-form + zod | 7.55 / 3.25.11 |
| **PnP** | @radix-ui/react-dialog, @radix-ui/react-sheet, vaul | Latest |
| **Dev Server** | Vite dev server, port 5174 | - |

---

## 2. FIREBASE CONFIGURATION (EXACT — Same Project)

**Project**: `food-hubbie`  
**Database**: Realtime Database (NOT Firestore)  
**Auth**: Firebase Auth (Email/Password — riders use phone@rider.com convention)  
**Storage**: Firebase Storage (profile photos)  
**Messaging**: Firebase Cloud Messaging (push notifications)  

### 2.1 Firebase Config Object
```typescript
const FOODHUBBIE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W"
};
```

### 2.2 Firebase Hosting Targets

> **IMPORTANT**: After building, update the rider hosting target in `firebase.json` from `"public": "RiderApp"` to `"public": "RiderApp/dist"` since Vite outputs to `dist/`.

| Target | Directory | Custom Domain |
|---|---|---|
| marketplace | `Marketplace/dist` | foodhubbie |
| admin | `ShopAdmin` / `AdminDashboard/dist` | foodhubbie-admin |
| rider | `RiderApp` → **`RiderApp/dist`** (UPDATE in firebase.json after build) | foodhubbie-rider |
| superadmin | `SuperAdmin` | foodhubbie-superadmin |
| supreme | `SupremeAdmin` | foodhubbie-supreme |

### 2.3 Firebase Services Used
- **`firebase/auth`** — Email/password auth. Riders log in with `{phone}@rider.com` + password
- **`firebase/database`** — All CRUD (Realtime Database). `runTransaction` for atomic wallet & order assignment
- **`firebase/storage`** — Profile photo uploads (JPEG resized to max 1024px, <200KB)
- **`firebase/messaging`** — Push notifications via FCM tokens
- **`firebase/database`** `onDisconnect` — Auto-set rider status to "Offline" on disconnect

### 2.4 Storage Structure
```
/foodhubbie-firebasestorage.app
  /riders/{riderId}_profile_{timestamp}.jpg    # Profile photos
```

---

## 3. FIREBASE DATABASE STRUCTURE (COMPLETE — Rider-Facing)

```typescript
// === ROOT NODES the Rider App reads/writes ===

interface RiderAppDB {
  // ─── Rider Profile (main rider data) ─────────────────
  riders: {
    [riderId: string]: {
      // Identity
      name: string;
      fatherName: string;
      age: string;
      aadharNo: string;          // Masked display (last 4 digits)
      aadharPhoto: string;        // Full Aadhar card image URL
      qualification: string;
      phone: string;
      address: string;
      profilePhoto: string;       // Profile picture URL

      // Status & Meta
      status: "Online" | "Offline";
      lastSeen: number;           // Timestamp
      fcmToken: string;
      businessId: string;         // Which business they deliver for
      isAdmin: boolean;           // Emergency OTP override capability

      // Earnings / Wallet
      wallet: {
        balance: number;           // Current withdrawable balance
        totalEarned: number;       // Lifetime earnings
        lastTx: string;            // Last transaction ID
        lastTxAt: number;          // Last transaction timestamp
      };

      // Ledger (transaction history)
      ledger: {
        [txId: string]: {
          txId: string;
          orderId: string;
          amount: number;
          type: "EARNING" | "SETTLEMENT" | "ADJUSTMENT";
          description: string;
          timestamp: number;
          outlet: string;          // Outlet name/ID
          method?: string;         // Cash/UPI
        }
      };

      // Notifications (in-app)
      notifications: {
        [notifId: string]: {
          title: string;
          body: string;
          timestamp: number;
          read: boolean;
          type: "info" | "success" | "warning";
          icon: string;
        }
      };

      // Location (real-time GPS)
      location: {
        lat: number;
        lng: number;
        accuracy: number;
        ts: number;                // Timestamp of last location update
        lastUpdate: number;
        signalLost?: boolean;
      };
    }
  };

  // ─── Rider Stats ────────────────────────────────────
  riderStats: {
    [riderId: string]: {
      totalOrders: number;
      totalEarnings: number;
      deliveriesToday?: number;
      earningsToday?: number;
    }
  };

  // ─── Orders (full details under business/outlet) ─────
  // Path: businesses/{bid}/outlets/{oid}/orders/{orderId}
  // Rider reads orders that are unassigned OR assigned to them
  RiderOrder = {
    id: string;
    orderId?: string;
    outletId: string;
    businessId: string;
    outletName: string;
    outletPhone?: string;
    outletAddress?: string;
    
    // Rider assignment
    assignedRider?: string;       // Email of assigned rider
    riderId?: string;             // Firebase UID of rider
    riderPhone?: string;
    acceptedAt?: number;
    
    // Status tracking
    status: OrderStatus;
    statusUpdatedAt?: number;
    statusUpdatedBy?: string;
    arrivedAtRestaurantAt?: number;
    pickedUpAt?: number;
    reachedDropAt?: number;
    deliveredAt?: number;
    
    // OTP verification
    deliveryOTP?: string;         // 4-digit code
    otp?: string;                 // Same as deliveryOTP (legacy field)
    otpVerifiedAt?: number;
    
    // Customer info
    customerName?: string;
    customerPhone?: string;
    phone?: string;               // Customer phone (legacy)
    address: string;
    lat: number;
    lng: number;
    
    // Order details
    items: Array<{
      menuItemId: string;
      name: string;
      image: string;
      quantity: number;
      price: number;
    }>;
    normalizedItems?: string;     // Readable item string
    subtotal: number;
    deliveryFee: number;
    total: number;
    discount?: number;
    couponCode?: string;
    couponDiscount?: number;
    globalDiscount?: number;
    paymentMethod: "cod" | "upi" | "card" | "wallet";
    paymentCollected?: boolean;
    verifiedBy?: string;
    
    // Timestamps
    createdAt: string;
    updatedAt: string;
    estimatedMinutes: number;
  };

  // ─── Global Orders Index ─────────────────────────────
  orders: {
    [orderId: string]: {
      orderId: string;
      businessId: string;
      outletId: string;
      status: string;
      total: number;
      createdAt: string;
    }
  };

  // ─── Businesses / Outlets (read-only for rider) ────
  businesses: {
    [bid: string]: {
      name: string;
      outlets: {
        [oid: string]: {
          name: string;
          address: string;
          location: { lat: number; lng: number };
          phone: string;
          settings: {
            Store: { lat: string; lng: string };
            Delivery: {
              riderAcceptanceRadius: number;  // Default: 1000 (meters)
              backupCode: string;              // 4-digit admin bypass code
            };
          };
        }
      }
    }
  };

  // ─── Bot Commands (WhatsApp) ─────────────────────────
  // NOTE: Actual path in DB is bot/{bid}/{oid}/commands, NOT botCommands/{outletId}
  bot: {
    [bid: string]: {
      [oid: string]: {
        commands: {
          [cmdId: string]: {
            action: "SEND_GENERIC_MESSAGE";
            phone: string;
            message: string;
            timestamp: number;
          }
        }
      }
    }
  };

  // ─── OTP Attempts (rate limiting) ────────────────────
  otpAttempts: {
    [orderId: string]: {
      count: number;
      lastTry: number;
      blockedUntil: number;
      lastResend: number;
      resendCount: number;
    }
  };

  // ─── Settlements (admin records) ─────────────────────
  settlements: {
    [riderId: string]: {
      [settlementId: string]: {
        amountCollected: number;
        ordersClearedCount: number;
        settledByAdmin: string;
        timestamp: number;
      }
    }
  };

  // ─── Error Logs ──────────────────────────────────────
  logs: {
    riderErrors: {
      [riderId: string]: {
        [timestamp: string]: {
          context: string;
          message: string;
          stack: string;
          timestamp: number;
          url?: string;
          riderName?: string;
        }
      }
    }
  };
}
```

### 3.1 Database Path Helpers
```typescript
const dbPaths = {
  rider:           (rId: string) => `riders/${rId}`,
  riderWallet:     (rId: string) => `riders/${rId}/wallet`,
  riderLedger:     (rId: string) => `riders/${rId}/ledger`,
  riderNotifs:     (rId: string) => `riders/${rId}/notifications`,
  riderLocation:   (rId: string) => `riders/${rId}/location`,
  riderStats:      (rId: string) => `riderStats/${rId}`,
  orders:          (bId: string, oId: string) => `businesses/${bId}/outlets/${oId}/orders`,
  singleOrder:     (bId: string, oId: string, orderId: string) => `businesses/${bId}/outlets/${oId}/orders/${orderId}`,
  outlet:          (bId: string, oId: string) => `businesses/${bId}/outlets/${oId}`,
  outletSettings:  (bId: string, oId: string) => `businesses/${bId}/outlets/${oId}/settings`,
  businesses:      () => `businesses`,
  ordersIndex:     () => `orders`,
  botCommands:     (bId: string, oId: string) => `bot/${bId}/${oId}/commands`,
  otpAttempts:     (orderId: string) => `otpAttempts/${orderId}`,
  settlements:     (rId: string) => `settlements/${rId}`,
  riderErrors:     (rId: string) => `logs/riderErrors/${rId}`,
};
```

### 3.2 Order Status Pipeline (Rider-Facing)
```typescript
type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Preparing"
  | "Cooked"
  | "Ready"
  | "Out for Delivery"
  | "Reached Drop Location"
  | "Delivered"
  | "Cancelled";

// Rider only interacts from "Ready" onwards:
// Ready → Accept → Reached Outlet → Picked Up (Out for Delivery) → Reached Drop → OTP Verify → Payment → Delivered
```

### 3.3 Security Rules (Rider-Relevant)
From the existing `database.rules.json`:
- `riders/{uid}` — Rider can read/write own node, admins can read/write any
- `riders/{uid}/kycStatus` — Only super admin can write
- `riders/{uid}/verified` — Only super admin can write
- `businesses/{bid}/outlets/{oid}/orders` — Rider can write if `newData.child('riderId').val() == auth.uid`
- `riderStats/{riderId}` — Rider can write own stats
- `logs/riderErrors` — Any authenticated user can write

---

## 4. COMPLETE DIRECTORY STRUCTURE

```
RiderApp/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── components.json                # shadcn/ui config
│
├── public/
│   ├── favicon.svg
│   ├── icon-512.png
│   ├── icon-192.png
│   ├── manifest.json
│   ├── sw.js                      # Service Worker (network-first)
│   ├── firebase-messaging-sw.js   # FCM background messaging SW
│   └── robots.txt
│
├── src/
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Root: providers + wouter router + auth gate
│   ├── index.css                  # Tailwind imports + full theme variables
│   ├── vite-env.d.ts
│   │
│   ├── assets/
│   │   └── sounds/
│   │       └── alert.mp3          # New order ping sound
│   │
│   ├── lib/
│   │   ├── firebase.ts            # Firebase init (same pattern as Marketplace)
│   │   ├── utils.ts               # cn(), formatCurrency, formatDate, getRelativeTime
│   │   └── constants.ts           # Path helpers, statuses, limits
│   │
│   ├── types/
│   │   └── index.ts               # ALL TypeScript interfaces
│   │
│   ├── hooks/
│   │   ├── useAuth.ts             # Rider auth (login, logout, session)
│   │   ├── useRiderProfile.ts     # Rider profile data listener
│   │   ├── useAvailableOrders.ts  # Real-time unassigned orders within 1km
│   │   ├── useActiveOrder.ts      # Current active delivery
│   │   ├── useOrderHistory.ts     # Completed deliveries
│   │   ├── useWallet.ts           # Wallet balance + ledger listener
│   │   ├── useEarnings.ts         # Earnings aggregation (today/weekly)
│   │   ├── useLocation.ts         # GPS tracking (watchPosition)
│   │   ├── useNotifications.ts    # In-app notification listener
│   │   ├── useSettlements.ts      # Settlement history
│   │   ├── useGeolocation.ts      # Browser geolocation hook
│   │   ├── use-mobile.tsx         # Mobile detection
│   │   └── use-toast.ts           # Sonner toast wrapper
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Rider auth + profile context
│   │   ├── RiderContext.tsx        # Current rider state (profile, wallet, status)
│   │   └── LocationContext.tsx     # GPS location tracking context
│   │
│   ├── services/
│   │   ├── authService.ts          # Firebase auth operations
│   │   ├── orderService.ts         # Accept, update status, complete delivery
│   │   ├── riderService.ts         # Profile CRUD, photo upload
│   │   ├── walletService.ts        # Ledger, balance, settlements
│   │   ├── locationService.ts      # GPS tracking + Firebase sync
│   │   ├── notificationService.ts  # FCM setup + in-app notifications
│   │   ├── storageService.ts       # Firebase Storage uploads
│   │   ├── whatsappService.ts      # WhatsApp alerts via bot node
│   │   └── auditService.ts         # Error logging
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components (generated)
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # Header + sidebar + main content + bottom nav
│   │   │   ├── Header.tsx          # Top bar: menu, logo, refresh, notif, status toggle
│   │   │   ├── Sidebar.tsx         # Hamburger nav: Dashboard, History, Ledger, Profile, etc.
│   │   │   ├── BottomNav.tsx       # 4 tabs: HOME, PICKUP, LIVE, WALLET
│   │   │   └── AuthGuard.tsx       # Auth route protection
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx       # Full auth page with animated orb background
│   │   │   ├── LoginForm.tsx       # Phone/email + password form
│   │   │   └── LoginCard.tsx       # Branded card with bike icon + security badge
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardHome.tsx   # Welcome greeting + date + today's stats
│   │   │   ├── PerformanceGrid.tsx # 2x2 stat grid (Green/Blue/Orange/Gold cards)
│   │   │   ├── StatCard.tsx        # Single stat card with icon, label, value
│   │   │   ├── ActiveDeliveryCard.tsx # Active delivery summary (if any)
│   │   │   ├── StepProgress.tsx    # 4-step progress bar (Accepted→Pickup→Transit→Drop)
│   │   │   └── EarningsSummary.tsx # "View Detailed Stats" button
│   │   │
│   │   ├── orders/
│   │   │   ├── AvailableOrders.tsx # Available pickup orders list
│   │   │   ├── OrderCard.tsx       # Card view: Outlet, Status, Destination, Earnings, Accept
│   │   │   ├── OrderTable.tsx      # Desktop table view of available orders
│   │   │   ├── OrderHistory.tsx    # Completed deliveries with search
│   │   │   ├── HistoryCard.tsx     # Single history entry
│   │   │   └── OrderSearch.tsx     # Search by Order ID input
│   │   │
│   │   ├── active-trip/
│   │   │   ├── ActiveTripView.tsx  # Main active delivery screen
│   │   │   ├── TripMap.tsx         # Leaflet map with rider + customer markers
│   │   │   ├── TaskCard.tsx        # Full task details card
│   │   │   ├── BillingSummary.tsx  # Subtotal, discounts, delivery fee, total
│   │   │   ├── ItemChecklist.tsx   # Verify items before pickup
│   │   │   ├── SlideToAction.tsx   # Zomato-style slide to advance steps
│   │   │   ├── ActionButtons.tsx   # CALL / CHAT / NAVIGATE buttons
│   │   │   └── RouteOptimizer.tsx  # Nearest-neighbor route optimization
│   │   │
│   │   ├── modals/
│   │   │   ├── VerificationModal.tsx  # Item checklist before pickup (bottom sheet)
│   │   │   ├── OTPSheet.tsx           # 4-digit OTP input panel (bottom sheet)
│   │   │   ├── PaymentSheet.tsx       # Cash/UPI payment collection (bottom sheet)
│   │   │   ├── ConfirmDialog.tsx      # Generic confirm/cancel
│   │   │   ├── NotificationSheet.tsx  # Slide-out notification panel
│   │   │   ├── PingModal.tsx          # Full-screen new order alert with 30s timer
│   │   │   ├── SuccessOverlay.tsx     # Confetti celebration on delivery complete
│   │   │   └── SettlementModal.tsx    # Settlement history dialog
│   │   │
│   │   ├── wallet/
│   │   │   ├── WalletView.tsx      # Ledger/earnings view
│   │   │   ├── EarningsHero.tsx    # Total balance + today earnings + unsettled cash
│   │   │   ├── TransactionList.tsx # Scrollable transaction history
│   │   │   ├── TransactionItem.tsx # Single transaction row with icon + amount
│   │   │   └── FilterPills.tsx     # Transaction type filters
│   │   │
│   │   ├── earnings/
│   │   │   ├── EarningsDetail.tsx  # Detailed earnings breakdown
│   │   │   ├── TodayHero.tsx       # Today's total, orders count, online hours
│   │   │   ├── SummaryGrid.tsx     # Cash to settle + weekly target with progress
│   │   │   ├── WeeklyChart.tsx     # Mon-Sun bar chart (recharts)
│   │   │   ├── ShopBreakdown.tsx   # Per-outlet earnings breakdown
│   │   │   └── SettlementButton.tsx # View settlement history
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileView.tsx     # Full profile page
│   │   │   ├── ProfilePhoto.tsx    # Editable circular photo with camera icon
│   │   │   ├── ProfileDetails.tsx  # Personal details list
│   │   │   ├── DetailRow.tsx       # Label + value row (with optional Edit)
│   │   │   ├── AadharCard.tsx      # Aadhar image show/hide
│   │   │   └── EditField.tsx       # Inline edit for phone/address
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationItem.tsx # Single notification (icon, title, body, time)
│   │   │   ├── NotificationBadge.tsx # Red dot badge on bell icon
│   │   │   └── ClearAllButton.tsx   # Clear all notifications
│   │   │
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx   # Loading indicator
│   │       ├── EmptyState.tsx       # Empty state with icon + message
│   │       ├── ErrorState.tsx       # Error display with retry
│   │       ├── StatusPill.tsx       # Online/Offline status pill
│   │       ├── CountBadge.tsx       # Number badge
│   │       ├── GlassCard.tsx        # Glassmorphism card wrapper
│   │       ├── SyncIndicator.tsx    # Offline sync status bar
│   │       ├── AudioPlayer.tsx      # Sound playback for ping alerts
│   │       └── OfflineQueue.tsx     # Offline action queue indicator
│   │
│   └── pages/          # Route-level pages
│       ├── DashboardPage.tsx
│       ├── AvailablePage.tsx
│       ├── ActiveTripPage.tsx
│       ├── CompletedPage.tsx
│       ├── WalletPage.tsx
│       ├── EarningsPage.tsx
│       ├── ProfilePage.tsx
│       └── NotFoundPage.tsx
```

---

## 5. COMPLETE COLOR SCHEME & DESIGN SYSTEM

### 5.1 Rider App Theme (Vibrant Orange — Light Mode Only)
```css
/* ─── LIGHT MODE ONLY (Restaurant vibrant feel) ─── */
:root {
  /* Brand — Vibrant Orange */
  --primary: #FF5200;
  --primary-rgb: 255, 82, 0;
  --primary-glow: rgba(255, 82, 0, 0.15);
  --primary-dark: #E64A00;
  --primary-light: #FFF5F1;

  /* Backgrounds */
  --bg-app: #F4F6F8;
  --bg-surface: #FFFFFF;
  --bg-glass: rgba(255, 255, 255, 0.9);
  --bg-card: rgba(255, 255, 255, 0.8);

  /* Text */
  --text-main: #1E293B;         /* Slate 800 */
  --text-muted: #64748B;        /* Slate 500 */
  --text-tertiary: #94A3B8;     /* Slate 400 */
  --text-inverse: #FFFFFF;

  /* Semantic */
  --success: #10B981;           /* Emerald 500 */
  --success-rgb: 16, 185, 129;
  --info: #3B82F6;              /* Blue 500 */
  --warning: #F59E0B;           /* Amber 500 */
  --danger: #EF4444;            /* Red 500 */
  --danger-rgb: 239, 68, 68;

  /* Dashboard Stat Colors */
  --stat-green: #10B981;
  --stat-blue: #3B82F6;
  --stat-orange: #FF5200;
  --stat-gold: #F59E0B;

  /* Shadows */
  --shadow-pro: 0 10px 30px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.06);
  --shadow-premium: 0 8px 32px rgba(0, 0, 0, 0.08);

  /* Layout */
  --header-height: 60px;
  --bottom-nav-height: 65px;
  --sidebar-width: 280px;
  --radius-card: 20px;
  --radius-glass: 16px;
  --radius-sm: 10px;

  /* Effects */
  --glass-blur: blur(12px);
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Fonts */
  --font-sans: 'Outfit', system-ui, sans-serif;
}
```

### 5.2 Typography
- **Unified Font**: `'Outfit', system-ui, sans-serif` (weights: 400, 500, 600, 700, 800, 900)
- **Letter Spacing**: Headings `-0.02em`, body `normal`
- **Line Height**: `1.5` body, `1.2` headings
- **Font Sizes**: xs(10px), sm(12px), base(13px), md(14px), lg(16px), xl(18px), 2xl(22px), 3xl(28px)

### 5.3 Design Principles
- **Vibrant Orange (#FF5200)** primary — matches the food delivery energy
- **Clean white surfaces** on light gray background (#F4F6F8)
- **Glassmorphism cards** with `backdrop-filter: blur(12px)` and subtle borders
- **Dashboard stat cards** are SOLID colored (not glass):
  - Green (#10B981) — "GREEN DELIVERED" for delivery count
  - Blue (#3B82F6) — "BLUE ON-TIME" for rating
  - Orange (#FF5200) — "ORANGE EARNINGS" for today's earnings
  - Gold (#F59E0B) — "GOLD RATING" for rider rating
- **Auth screen**: Dark glassmorphism with floating gradient orbs
- **Bottom nav**: Fixed at bottom, 4 tabs with active indicator
- **Slide-to-action**: Zomato-style draggable handle for delivery steps (framer-motion drag)
- **Success celebration**: Confetti animation (150 particles, orange/green)
- **All modals** are bottom sheets (mobile-first)

---

## 6. COMPLETE ROUTING & NAVIGATION

### 6.1 Wouter Routes (Hash-based)
```typescript
const routes = {
  "/":              DashboardPage,
  "/dashboard":     DashboardPage,
  "/available":     AvailablePage,
  "/active":        ActiveTripPage,
  "/completed":     CompletedPage,
  "/wallet":        WalletPage,
  "/earnings":      EarningsPage,
  "/profile":       ProfilePage,
};
```

### 6.2 Bottom Navigation (4 tabs — always visible)
```
[HOME 🏠]    [PICKUP 🛍️]    [LIVE 📍]    [WALLET 💰]
```

- **HOME** → Dashboard (stats, active delivery card, earnings summary)
- **PICKUP** → Available orders with badge count
- **LIVE** → Active trip (map + task card) — shows "No active trip" if none
- **WALLET** → Earnings ledger/balance

### 6.3 Sidebar Navigation (hamburger menu)
```
👤 Rider Name
   RID-XXXX

📊 Dashboard          → /dashboard
📜 Trip History       → /completed
💰 Earnings Ledger    → /wallet
👤 My Profile         → /profile
─────────────────────
⬇️ Install App        → [PWA install, hidden if unavailable]
🔄 Reset App          → [completeSiteRefresh]
🚪 Sign Out           → [logout]
```

---

## 7. COMPLETE FEATURES LIST (Every Feature, Minor to Minor)

### 7.1 AUTHENTICATION
- [ ] Login page with animated background (3 floating gradient orbs + grid pattern)
- [ ] Brand card with bike icon + "Foodhubbie Rider Delivery Portal"
- [ ] Mobile Number or Email input (autocomplete="username")
- [ ] Password input with show/hide toggle (autocomplete="current-password")
- [ ] "Sign In & Start Delivering" button with loading spinner state
- [ ] Error display: "Invalid credentials", "Too many attempts", "Network error"
- [ ] Firebase Auth signInWithEmailAndPassword
- [ ] Auto-login convention: rider types mobile → transformed to `{phone}@rider.com`
- [ ] Session persisted: `localStorage.setItem('isLoggedIn', 'true')`
- [ ] Skeleton mode: If session cached, show skeleton immediately on next load
- [ ] Version enforcement: Check `rider_app_version` against `4.7.1`
- [ ] On version mismatch: unregister SW, clear caches, force reload
- [ ] Security badge: "Secured with Firebase Auth"
- [ ] Help text: "Contact your admin if you forgot your credentials"
- [ ] Seamless loading engine (skip loader if logged in)

### 7.2 LOADER / SKELETON
- [ ] Orange background loader with ripple animation + zap icon
- [ ] After auth check: fade to skeleton mode (gray background)
- [ ] Skeleton header: 3 placeholder blocks (avatar, text, icon)
- [ ] Skeleton stats grid: 2 skeleton cards
- [ ] Skeleton list items: 2 large skeleton cards
- [ ] Skeleton shimmer animation
- [ ] Smooth transition from skeleton to real content

### 7.3 HEADER / TOP BAR
- [ ] Mobile hamburger menu button (opens sidebar)
- [ ] App logo: "FOODHUBBIE RIDER"
- [ ] Refresh button (icon)
- [ ] Notification bell with red dot badge (unread count)
- [ ] Online/Offline status toggle pill:
  - [ ] Green pulse dot + "ONLINE" text when online
  - [ ] Gray dot + "OFFLINE" text when offline
  - [ ] Click toggles duty status in Firebase
- [ ] Sync status bar (hidden by default):
  - [ ] "Syncing X action(s)..." when online with queued actions
  - [ ] "Offline - X action(s) queued" when offline with queued actions
  - [ ] Spinning refresh icon during sync

### 7.4 DASHBOARD (HOME)
- [ ] Welcome greeting: "Welcome, {name}!" with orange highlight
- [ ] Subtitle: "Ready for your next delivery?"
- [ ] Current date display
- [ ] **Today's Performance** — 2x2 solid stat card grid:
  - [ ] **GREEN DELIVERED** (green card): Delivery count today
  - [ ] **BLUE ON-TIME** (blue card): Average rating / on-time %
  - [ ] **ORANGE EARNINGS** (orange card): Today's earnings ₹
  - [ ] **GOLD RATING** (gold card): Rider rating (default 4.9)
- [ ] "VIEW DETAILED STATS" button → navigates to Earnings page
- [ ] **Active Delivery Card** (if rider has active order):
  - [ ] 4-step progress bar (ACCEPTED→PICKUP→TRANSIT→DROP)
  - [ ] Order info summary
  - [ ] Navigate to LIVE section button
- [ ] Pull-to-refresh gesture (touch + drag down)

### 7.5 AVAILABLE ORDERS (PICKUP)
- [ ] Section header: "Available Pickup" + count badge
- [ ] Real-time listener for unassigned orders (status: "Ready" or "Cooked")
- [ ] Proximity filter: only show orders within 1km of rider
- [ ] **Order Card/Table**:
  - [ ] Order ID
  - [ ] Outlet name
  - [ ] Status badge
  - [ ] Destination address
  - [ ] Earnings amount (delivery fee)
  - [ ] Total order amount
  - [ ] "ACCEPT" button
- [ ] Empty state: "No new orders available right now"
- [ ] **New Order Ping Modal** (full-screen on arrival):
  - [ ] Outlet name subtitle
  - [ ] "Incoming Order" title
  - [ ] Order ID display
  - [ ] Customer address card (glass panel)
  - [ ] Order total + "ESTIMATED EARNING" label
  - [ ] 30-second circular countdown timer
  - [ ] "ACCEPT TASK" button (orange, primary)
  - [ ] "SKIP THIS TASK" button (ghost)
  - [ ] Audio alert: plays `alert.mp3` on arrival
  - [ ] Haptic feedback: `navigator.vibrate(200)`

### 7.6 ORDER ACCEPTANCE FLOW
- [ ] **Accept**: `runTransaction` on `orders/{id}` to atomically set:
  - [ ] `assignedRider: rider.email`
  - [ ] `riderId: rider.uid`
  - [ ] `riderPhone: rider.phone`
  - [ ] `deliveryOTP: Math.floor(1000 + Math.random() * 9000)`
  - [ ] `acceptedAt: Date.now()`
- [ ] **Proximity check**: Must be within 1km of outlet (fail with toast if not)
- [ ] **Offline queue**: If offline, queue action for later sync
- [ ] **WhatsApp alert**: Sends "I am your delivery partner..." to customer
- [ ] On success: show toast "Order Accepted!" + navigate to LIVE tab
- [ ] On fail (already taken): show error toast

### 7.7 ACTIVE TRIP (LIVE)
- [ ] **Map** (react-leaflet with OpenStreetMap tiles):
  - [ ] Rider current location (orange circle marker with "You are here")
  - [ ] Customer drop location (standard marker with "Customer Location")
  - [ ] Auto-fit bounds to show both locations
  - [ ] Store/outlet location marker
- [ ] **Route Optimization Button** (when ≥ 2 active orders):
  - [ ] "OPTIMIZE DELIVERY ROUTE" with route icon
  - [ ] Nearest-neighbor algorithm for stop ordering
  - [ ] Step-by-step stop sequence display
  - [ ] Shows/hides based on active order count
- [ ] **Task Card** (glassmorphism):
  - [ ] Order ID badge
  - [ ] Outlet name badge
  - [ ] **4-Step Progress** (colored circles connected by line):
    - Step 1: Accepted (check)
    - Step 2: Pickup (package icon)
    - Step 3: Transit (navigation icon)
    - Step 4: Drop (shield icon)
  - [ ] **Location Box** — shows address with location icon
  - [ ] **Billing Summary**:
    - [ ] Subtotal
    - [ ] Delivery Fee
    - [ ] Discount (if any)
    - [ ] Total to collect (large text)
  - [ ] **Item Checklist** (tap to expand at restaurant step)
  - [ ] **Action Buttons**:
    - [ ] "CALL" — opens `tel:{customerPhone}`
    - [ ] "CHAT" — opens `https://wa.me/91{phone}`
    - [ ] "NAVIGATE" — opens Google Maps `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
- [ ] **Zomato-style Slider Controls** (draggable handle to advance):
  - [ ] "SLIDE TO REACH OUTLET" → `reachedOutlet()`
  - [ ] "SLIDE TO PICK UP" → `confirmPickup()` (opens item checklist first)
  - [ ] "SLIDE TO REACH CUSTOMER" → `reachedDropLocation()`
  - [ ] "ENTER DELIVERY OTP" → opens OTP panel
- [ ] Empty state: "No active trip currently."

### 7.8 DELIVERY STEP ACTIONS
- **Reached Outlet** (`reachedOutlet()`):
  - [ ] Proximity check: ≤ 1000m from outlet
  - [ ] Sets `arrivedAtRestaurantAt: serverTimestamp()`
  - [ ] Updates step progress to Step 2

- **Pickup / Confirm Pickup** (`confirmPickup()`):
  - [ ] Opens **Verification Modal** (bottom sheet with item checklist)
  - [ ] Each item listed with name + quantity + checkbox
  - [ ] "ORDER PICKED UP" button
  - [ ] Proximity check: ≤ 300m from outlet
  - [ ] Sets `status: "Out for Delivery"`, `pickedUpAt: serverTimestamp()`
  - [ ] Opens Google Maps navigation
  - [ ] Sends WhatsApp: "I have picked up your order..."
  - [ ] Updates progress to Step 3

- **Reached Drop Location** (`reachedDropLocation()`):
  - [ ] Proximity check: ≤ riderAcceptanceRadius (default 1000m)
  - [ ] Sets `status: "Reached Drop Location"`, `reachedDropAt: serverTimestamp()`
  - [ ] Sends WhatsApp arrival alert
  - [ ] Opens **OTP Panel** automatically
  - [ ] Updates progress to Step 4

### 7.9 OTP VERIFICATION
- [ ] **OTP Panel** (modal/bottom sheet):
  - [ ] "TRIP COMPLETE" title (orange)
  - [ ] "Enter 4-digit verification code from customer"
  - [ ] Large centered OTP input (42px font, 12px letter spacing, maxlength=4)
  - [ ] "REGENERATE & SEND OTP" button with 60-second cooldown
  - [ ] "VERIFY" button (primary)
  - [ ] "LATER" button (outline)
  - [ ] "EMERGENCY OVERRIDE" button (red, visible only if `isAdmin: true`)
- [ ] **OTP Validation Logic**:
  - [ ] Compare input against `deliveryOTP` or `otp` on the order
  - [ ] Fallback: compare against `backupCode` from outlet settings
  - [ ] **Rate limiting**: 10 attempts → 60-second block (`otpAttempts/{orderId}`)
  - [ ] Block indicator: "Too many attempts. Try again in 60s"
- [ ] On success: Opens **Payment Panel**

### 7.10 PAYMENT COLLECTION
- [ ] **Payment Panel** (modal/bottom sheet):
  - [ ] "COLLECT PAYMENT" title (orange)
  - [ ] "Total to collect: ₹{total}" text
  - [ ] Two payment buttons:
    - [ ] "CASH" button with banknote icon
    - [ ] "UPI" button with smartphone icon
  - [ ] "CANCEL" button (ghost)
- [ ] On method select → calls `recordPaymentAndComplete(method)`
- [ ] **Payment Flow**:
  - [ ] Sets `paymentMethod: "Cash" | "UPI"` on order
  - [ ] Sets `paymentCollected: true`
  - [ ] Creates **Ledger Entry** at `riders/{riderId}/ledger/{txId}`
  - [ ] Runs `runTransaction` to increment `wallet.balance` + `wallet.totalEarned`
  - [ ] Updates `riderStats/{riderId}` (atomic increment)
  - [ ] Sets `status: "Delivered"`, `deliveredAt: serverTimestamp()`

### 7.11 DELIVERY COMPLETION (SUCCESS)
- [ ] **Success Overlay** (full-screen modal):
  - [ ] Green check-circle icon (large)
  - [ ] "DELIVERED!" title (green)
  - [ ] "Order completed successfully" subtitle
  - [ ] Delivery summary: Payment method + Earnings amount
  - [ ] "BACK TO HOME" button
- [ ] **Confetti Animation** (canvas-confetti):
  - [ ] 150 particles
  - [ ] Spread: 70
  - [ ] Colors: Orange (#FF5200) + Green (#10B981)
  - [ ] Auto-fires on delivery complete
- [ ] Auto-closes success overlay after 4 seconds

### 7.12 TRIP HISTORY (COMPLETED)
- [ ] "Trip History" heading
- [ ] Search box: "Search by Order ID..." with search icon
- [ ] Completed orders list (cards or table):
  - [ ] Order ID
  - [ ] Date/time
  - [ ] Destination address
  - [ ] Earnings amount
  - [ ] Status: "DONE" badge (green)
- [ ] Empty state: "No delivery history yet"
- [ ] Search filtering: filter by order ID match

### 7.13 WALLET / LEDGER
- [ ] **Earnings Hero** card:
  - [ ] "TOTAL LEDGER BALANCE" label
  - [ ] Large balance amount (₹X,XXX.XX)
  - [ ] Two mini-stats:
    - [ ] "Today" — today's earnings
    - [ ] "Unsettled Cash" — cash not yet settled by admin
- [ ] **Transaction History**:
  - [ ] Filter pills: "ALL" (expandable to EARNINGS/SETTLEMENTS)
  - [ ] Scrollable list with animated fade-in items
  - [ ] Each transaction shows:
    - [ ] Icon (earning: green up-arrow, settlement: blue wallet)
    - [ ] Description (e.g., "Delivery - Order #RDX_xxx")
    - [ ] Date/time
    - [ ] Amount (green positive, red negative)
- [ ] Empty state: "No transactions yet"

### 7.14 EARNINGS DETAILS
- [ ] **Today's Hero**:
  - [ ] "TODAY'S EARNINGS" label
  - [ ] Large amount
  - [ ] Mini-stats: Orders count + Online hours
- [ ] **Summary Grid** (2 cards):
  - [ ] "CASH TO SETTLE" — amount + "History" button
  - [ ] "WEEKLY TARGET" — percentage + progress bar
- [ ] **Weekly Chart** (recharts bar chart):
  - [ ] Mon-Sun bars
  - [ ] Current day highlighted
  - [ ] Bar height proportional to earnings
- [ ] **Shop Breakdown**:
  - [ ] Per-outlet earnings (dynamic — shows any outlet)
  - [ ] Each outlet: icon, name, total orders, total earnings, today's earnings
- [ ] **View Settlement History** button → opens Settlement modal

### 7.15 PROFILE
- [ ] **Profile Photo**:
  - [ ] Circular photo (default: SVG placeholder with initials)
  - [ ] Camera edit button overlay
  - [ ] File upload → Firebase Storage (JPEG, max 1024px, <200KB)
  - [ ] Canvas resize before upload
- [ ] **Name** — displayed prominently
- [ ] **Phone** — displayed with masked formatting
- [ ] **Personal Details** list:
  - [ ] Father's Name (read-only)
  - [ ] Age (read-only)
  - [ ] Aadhar Card (masked, last 4 digits only)
  - [ ] Qualification (read-only)
  - [ ] Contact Phone (editable via prompt)
  - [ ] Address (editable via prompt)
  - [ ] Aadhar Image (SHOW/HIDE toggle, expands image)
- [ ] Edit buttons: "EDIT" opens prompt() dialog, saves to Firebase
- [ ] Aadhar image: toggle visibility with show/hide button

### 7.16 NOTIFICATIONS
- [ ] Slide-out sheet from right
- [ ] Header: "Notifications" + "Clear All" button + Close (X) button
- [ ] Notification items:
  - [ ] Icon (info/success/warning)
  - [ ] Title (bold)
  - [ ] Body text
  - [ ] Timestamp (relative)
  - [ ] Unread indicator (red dot)
- [ ] Empty state: "No new notifications"
- [ ] **FCM Push Notifications**:
  - [ ] Request permission on login
  - [ ] Get FCM token → store at `riders/{riderId}/fcmToken`
  - [ ] Listen for foreground messages (`onMessage`)
  - [ ] Service worker handles background messages

### 7.17 GPS LOCATION TRACKING
- [ ] `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`
- [ ] Updates rider location to `riders/{riderId}/location` every 10 seconds
- [ ] Location data: `{ lat, lng, accuracy, ts }`
- [ ] Auto-starts when rider goes Online
- [ ] Auto-stops when rider goes Offline
- [ ] `onDisconnect` handler: auto-sets status to "Offline" on connection drop
- [ ] Permission denied: show status indicator with feedback
- [ ] Used for proximity checks (outlet, customer location)

### 7.18 MAP (REACT-LEAFLET)
- [ ] OpenStreetMap tiles via react-leaflet
- [ ] Two map modes:
  - [ ] **Default Map**: Shows rider's current location with orange circle marker
  - [ ] **Active Trip Map**: Shows customer marker + rider marker, auto-fits bounds
- [ ] Rider marker: Orange circle (#FF5200) with "You are here" popup
- [ ] Customer marker: Standard Leaflet marker with "Customer Location" popup
- [ ] Store/outlet marker (when applicable)
- [ ] Google Maps deep link: "NAVIGATE" button opens `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`

### 7.19 ROUTE OPTIMIZATION
- [ ] Nearest-neighbor heuristic algorithm
- [ ] Collects all active orders for the rider
- [ ] Builds optimized pickup→dropoff stop sequence
- [ ] Button: "OPTIMIZE DELIVERY ROUTE" (visible when ≥ 2 active orders)
- [ ] Route summary: step-by-step stop list
- [ ] Re-calculates when orders complete

### 7.20 SETTLEMENTS
- [ ] **Settlement Modal**:
  - [ ] "Settlement History" title
  - [ ] Close button (X)
  - [ ] Settlement records list:
    - [ ] Admin name who settled
    - [ ] Amount collected
    - [ ] Orders cleared count
    - [ ] Timestamp
  - [ ] Empty state: "No settlements found"
- [ ] Trigger from: Earnings page "History" button

### 7.21 OFFLINE SUPPORT
- [ ] **Offline Queue** system (localStorage):
  - [ ] Queued actions: `ACCEPT_ORDER`, `UPDATE_STATUS`, `REACHED_OUTLET`
  - [ ] Each action: `{ type, payload, queuedAt, id }`
  - [ ] Auto-syncs when browser comes online (`window.addEventListener('online')`)
  - [ ] Failed actions remain in queue for retry
- [ ] **Sync Indicator UI**:
  - [ ] Header bar: "Syncing X action(s)..." with spinning icon
  - [ ] Header bar: "Offline - X action(s) queued" (amber)
- [ ] **Service Worker** (network-first strategy):
  - [ ] Cache name: `roshani-rider-v7.0`
  - [ ] Precached: index.html, style.css, icon-512.png, alert.mp3
  - [ ] HTML/JS/CSS: Network-first with cache fallback
  - [ ] Assets/libs: Cache-first
  - [ ] Push event listener for background notifications
  - [ ] Notification click → focus existing window or open new

### 7.22 FCM BACKGROUND MESSAGING
- [ ] `firebase-messaging-sw.js` (separate service worker file):
  - [ ] Uses compat SDK for background message handling
  - [ ] `onBackgroundMessage` → shows notification with title + body + icon
- [ ] Foreground messages: handled by `onMessage` → create in-app notification

### 7.23 WHATSAPP INTEGRATION
- [ ] Automated WhatsApp alerts sent via `bot/{bid}/{oid}/commands` Firebase node:
  - [ ] **ACCEPTED**: "Hello! I am {riderName}, your delivery partner for Foodhubbie order #{orderId}. I am on my way to pick up your order!"
  - [ ] **PICKED_UP**: "Great news! I have picked up your order #{orderId}. If you need anything, you can call me at {riderPhone}. I am on my way!"
  - [ ] **REACHED_DROP**: "I have arrived at your drop location with your order #{orderId}! Please have your 4-digit OTP ready."
  - [ ] **SEND_OTP**: "Your Foodhubbie order #{orderId} has arrived! To safely receive your order, please provide this 4-digit OTP to the rider: {otp}"
  - [ ] **ARRIVED**: "I have arrived with your order #{orderId}! Please have your 4-digit OTP ready."
- [ ] Manual chat: "CHAT" button opens `https://wa.me/91{phone}` in new tab

### 7.24 PWA
- [ ] `manifest.json`:
  - [ ] Name: "Roshani Rider Hub"
  - [ ] Short name: "Roshani Rider"
  - [ ] Display: standalone
  - [ ] Theme color: #FF5200
  - [ ] Background color: #F4F6F8
  - [ ] Orientation: portrait-primary
  - [ ] Icons: 512x512 maskable
- [ ] Service Worker (sw.js)
- [ ] Firebase Messaging SW (firebase-messaging-sw.js)
- [ ] "Install App" button in sidebar (hidden if PWA already installed)
- [ ] `theme-color` meta tag
- [ ] `apple-mobile-web-app-capable` meta tag

### 7.25 GENERAL UI
- [ ] Pull-to-refresh gesture indicator (arrow rotates on pull)
- [ ] **Nuclear Refresh** (`completeSiteRefresh()`):
  - [ ] Unregisters all service workers
  - [ ] Clears all browser caches
  - [ ] Clears localStorage active order state + sessionStorage
  - [ ] Force-reloads page with cache-busting query params
- [ ] "Reset App" button in sidebar (warning style)
- [ ] "Sign Out" button in sidebar (danger style)
- [ ] Haptic feedback on actions (`navigator.vibrate()`)
- [ ] Toast notifications (sonner) for success/error/info
- [ ] Loading states (spinners) for async operations
- [ ] Empty states with helpful messages and icons
- [ ] Error states with retry capability
- [ ] Glassmorphism card styling throughout
- [ ] Confirmation dialog for destructive actions

---

## 8. DATA MODELS (TypeScript Types)

```typescript
// === src/types/index.ts ===

export type RiderStatus = "Online" | "Offline";

export type Rider = {
  uid: string;
  name: string;
  fatherName: string;
  age: string;
  aadharNo: string;
  aadharPhoto: string;
  qualification: string;
  phone: string;
  address: string;
  profilePhoto: string;
  status: RiderStatus;
  lastSeen: number;
  fcmToken: string;
  businessId: string;
  isAdmin: boolean;
  wallet: RiderWallet;
  ledger?: Record<string, LedgerEntry>;
  notifications?: Record<string, RiderNotification>;
  location?: RiderLocation;
};

export type RiderWallet = {
  balance: number;
  totalEarned: number;
  lastTx: string;
  lastTxAt: number;
};

export type LedgerEntry = {
  txId: string;
  orderId: string;
  amount: number;
  type: "EARNING" | "SETTLEMENT" | "ADJUSTMENT";
  description: string;
  timestamp: number;
  outlet: string;
  method?: string;
};

export type RiderNotification = {
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  type: "info" | "success" | "warning";
  icon: string;
};

export type RiderLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
  lastUpdate: number;
  signalLost?: boolean;
};

export type RiderStats = {
  totalOrders: number;
  totalEarnings: number;
  deliveriesToday?: number;
  earningsToday?: number;
};

export type OrderStatus =
  | "Placed" | "Confirmed" | "Preparing" | "Cooked"
  | "Ready" | "Out for Delivery" | "Reached Drop Location"
  | "Delivered" | "Cancelled";

export type RiderOrder = {
  id: string;
  orderId?: string;
  outletId: string;
  businessId: string;
  outletName: string;
  outletPhone?: string;
  outletAddress?: string;
  assignedRider?: string;
  riderId?: string;
  riderPhone?: string;
  acceptedAt?: number;
  status: OrderStatus;
  statusUpdatedAt?: number;
  statusUpdatedBy?: string;
  arrivedAtRestaurantAt?: number;
  pickedUpAt?: number;
  reachedDropAt?: number;
  deliveredAt?: number;
  deliveryOTP?: string;
  otp?: string;
  otpVerifiedAt?: number;
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  address: string;
  lat: number;
  lng: number;
  items: OrderItem[];
  normalizedItems?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  discount?: number;
  couponCode?: string;
  couponDiscount?: number;
  globalDiscount?: number;
  paymentMethod: "cod" | "upi" | "card" | "wallet";
  paymentCollected?: boolean;
  verifiedBy?: string;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
};

export type DeliveryStep = "accepted" | "reached_outlet" | "picked_up" | "reached_drop" | "completed";

export type Settlement = {
  id: string;
  amountCollected: number;
  ordersClearedCount: number;
  settledByAdmin: string;
  timestamp: number;
};

export type OfflineAction = {
  type: "ACCEPT_ORDER" | "UPDATE_STATUS" | "REACHED_OUTLET";
  payload: any;
  queuedAt: number;
  id: string;
};

export type AvailableOrder = {
  id: string;
  outletName: string;
  outletId: string;
  businessId: string;
  status: string;
  address: string;
  lat: number;
  lng: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  distance?: number;
};
```

---

## 9. AUTHENTICATION FLOW

```
1. User opens app → Check localStorage 'isLoggedIn'
2. If true → Show skeleton mode immediately (skip loader)
3. Show loader (orange bg, ripple, zap icon) → Firebase onAuthStateChanged
4. If not authenticated → Show Login Page:
   - Animated background (3 floating gradient orbs + grid pattern)
   - Dark glassmorphism auth card
   - Bike icon + "Foodhubbie Rider Delivery Portal"
   - Mobile Number / Email input
   - Password input with eye toggle
   - "Sign In & Start Delivering" button
   - Error display for invalid/rate-limited/network errors
   - Security badge + help text
5. Rider enters mobile number (10 digits) → transformed to {phone}@rider.com
6. signInWithEmailAndPassword(email, password)
7. On success:
   - Load rider profile from riders/{uid}
   - Start GPS tracking
   - Initialize FCM for push notifications
   - Show dashboard
8. On error: Display appropriate error message
9. Session persists automatically (Firebase Auth SDK handles this)
10. localStorage.setItem('isLoggedIn', 'true') for next-load skeleton
11. On logout: signOut() → clear state → stop GPS → show login
```

---

## 10. FIREBASE SERVICE IMPLEMENTATION PATTERN

```typescript
// === src/lib/firebase.ts ===
// Same pattern as Marketplace — modular SDK

import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, get, set, update, remove, push,
  runTransaction, query, orderByChild, equalTo,
  limitToLast, onValue, off, serverTimestamp, onDisconnect
} from "firebase/database";
import {
  getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const FOODHUBBIE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W"
};

const app = initializeApp(FOODHUBBIE_FIREBASE_CONFIG);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export {
  app, analytics, db, auth, storage, messaging,
  ref, get, set, update, remove, push, runTransaction,
  query, orderByChild, equalTo, limitToLast,
  onValue, off, serverTimestamp, onDisconnect,
  signInWithEmailAndPassword, firebaseSignOut, onAuthStateChanged,
  storageRef, uploadBytes, getDownloadURL,
  getToken, onMessage
};
export default app;
```

---

## 11. VITE CONFIGURATION

```typescript
// === vite.config.ts ===
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    strictPort: false,
    host: "0.0.0.0",
  },
});
```

---

## 12. CRITICAL IMPLEMENTATION PATTERNS (Extracted from Legacy App.js)

### 12.1 Order Acceptance — Atomic `runTransaction`
This is the most critical pattern. It prevents double-acceptance:
```typescript
const result = await runTransaction(ref(db, orderPath), (current) => {
  if (current && current.assignedRider) return; // Abort if already assigned
  const initialOTP = Math.floor(1000 + Math.random() * 9000).toString();
  return {
    ...current,
    deliveryOTP: initialOTP,
    otp: initialOTP, // Legacy field — write both
    assignedRider: currentUser.email.toLowerCase(),
    riderId: currentUser.uid,
    riderPhone: currentUser.profile.phone || "",
    acceptedAt: Date.now()
  };
});
if (result.committed) {
  // Success — show toast, send WhatsApp
} else {
  // Order already taken — show error
}
```

### 12.2 4-Step Delivery Status → Step Mapping
```typescript
function getDeliveryStep(order: RiderOrder): number {
  const status = (order.status || "").toLowerCase();
  if (status === "reached drop location" || order.reachedDropAt) return 3;
  if (status === "out for delivery" || order.pickedUpAt) return 2;
  if (order.arrivedAtRestaurantAt) return 1;
  return 0; // Accepted, Ready, Cooked, Preparing, Confirmed
}
// Steps: 0=ACCEPTED, 1=PICKUP, 2=TRANSIT, 3=DROP
```

### 12.3 Proximity Gate Values (Hardcoded)
| Action | Max Distance | Check |
|---|---|---|
| Accept Order | 1.0 km (1000m) | From rider to outlet coordinates |
| Reached Outlet | 1.0 km (1000m) | From rider to outlet coordinates |
| Confirm Pickup | 0.3 km (300m) | From rider to outlet coordinates |
| Reached Drop | `riderAcceptanceRadius` (default 1.0 km) | From rider to order.lat/lng |

### 12.4 OTP Rate Limiting — `runTransaction`
```typescript
// On failed attempt:
const result = await runTransaction(ref(db, otpAttemptsPath), (current) => {
  const data = current || { count: 0, lastTry: 0, blockedUntil: 0 };
  data.count++;
  data.lastTry = now;
  if (data.count >= 10) data.blockedUntil = now + (60 * 1000); // 60s block
  return data;
});

// On successful verify:
await remove(ref(db, otpAttemptsPath)); // Clear attempts on success
```

### 12.5 OTP Regeneration (60-second cooldown)
```typescript
// Check cooldown
if (now - (lastResend || 0) < 60000) {
  return showToast(`Wait ${remaining}s before resending.`);
}
// Generate new OTP
await update(ref(db, orderPath), { deliveryOTP: newOTP, otp: newOTP });
// Update resend count in otpAttempts
```

### 12.6 Payment Complete — Wallet + Ledger Transaction
```typescript
// 1. Update order status
await update(ref(db, orderPath), {
  status: "Delivered",
  deliveredAt: serverTimestamp(),
  verifiedBy: matchesFallback ? 'ADMIN_FALLBACK' : 'OTP',
  paymentCollected: true,
  paymentMethod: method.toUpperCase()
});

// 2. Create ledger entry
const txId = `RDX_${Date.now()}_${random.toUpperCase()}`;
await set(ref(db, `riders/${riderId}/ledger/${txId}`), {
  txId, orderId: order.orderId,
  amount: commission, type: 'EARNING',
  description: `Delivery Fee for Order #${orderId}`,
  timestamp: serverTimestamp(), outlet: outletId
});

// 3. Update wallet via atomic transaction
await runTransaction(ref(db, `riders/${riderId}/wallet`), (current) => {
  const data = current || { balance: 0, totalEarned: 0 };
  return {
    balance: (data.balance || 0) + commission,
    totalEarned: (data.totalEarned || 0) + commission,
    lastTx: txId,
    lastTxAt: serverTimestamp()
  };
});

// 4. Update riderStats
await runTransaction(ref(db, `riderStats/${riderId}`), (current) => {
  if (!current) return { totalOrders: 1, totalEarnings: commission };
  return {
    ...current,
    totalOrders: (current.totalOrders || 0) + 1,
    totalEarnings: (current.totalEarnings || 0) + commission
  };
});
```

### 12.7 Profile Photo Upload (Canvas Resize)
```typescript
async function compressImage(file: File, targetSizeKB = 200): Promise<Blob> {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  // ... load image into canvas
  // Max width: 1024px
  // Compress JPEG quality iteratively until < 200KB
  // Upload to: storageRef(dbStorage, `riders/${riderId}/profile_${Date.now()}.jpg`)
}
```

### 12.8 onDisconnect — Auto Set Offline
```typescript
const riderRef = ref(db, `riders/${user.uid}`);
onDisconnect(riderRef).update({
  status: "Offline",
  lastSeen: serverTimestamp(),
  connectionLostAt: serverTimestamp()
});

// Also for location:
onDisconnect(riderLocationRef).update({
  signalLost: true,
  lastSeen: serverTimestamp()
});
```

### 12.9 GPS Tracking (10-second intervals)
```typescript
// Start:
const watchId = navigator.geolocation.watchPosition(
  (pos) => {
    riderLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      ts: Date.now()
    };
  },
  (err) => { /* handle permission denied, unavailable, timeout */ },
  { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
);

// Sync to Firebase every 10 seconds:
const intervalId = setInterval(() => {
  if (riderLocation && status === "Online") {
    update(ref(db, `riders/${uid}/location`), {
      ...riderLocation,
      lastUpdate: serverTimestamp()
    });
    update(ref(db, `riders/${uid}`), { lastSeen: serverTimestamp() });
  }
}, 10000);
```

### 12.10 Multi-Outlet Order Discovery
```typescript
// On startup, load ALL businesses and their outlets:
const bizSnap = await get(ref(db, 'businesses'));
const businesses = bizSnap.val() || {};

// Build a cache of outlet coordinates and settings
for (const [bid, biz] of Object.entries(businesses)) {
  for (const [oid, outlet] of Object.entries(biz.outlets || {})) {
    outletCoords[oid] = { lat: out.settings.Store.lat, lng: out.settings.Store.lng };
    outletSettings[oid] = { riderAcceptanceRadius: out.settings.Delivery.riderAcceptanceRadius };
  }
}

// Listen to ALL outlets for orders:
outlets.forEach(({ bid, oid }) => {
  const ordersPath = `businesses/${bid}/outlets/${oid}/orders`;
  
  // 1. Unassigned orders (available for pickup)
  const q1 = query(ref(db, ordersPath), orderByChild('assignedRider'), equalTo(""));
  onValue(q1, (snap) => updateCache(snap.val()));

  // 2. Orders assigned to current rider
  const q2 = query(ref(db, ordersPath), orderByChild('assignedRider'), equalTo(currentEmail));
  onValue(q2, (snap) => updateCache(snap.val()));
});
```

### 12.11 Ghost Order Detection
```typescript
// Orders older than 12 hours with no timestamp are filtered out
const isGhost = (orderTime > 0 && orderTime < (Date.now() - 12 * 60 * 60 * 1000)) 
  || (!orderTime && isActive);

// Only show orders within 12-hour window
const isFresh = orderTime > (Date.now() - 12 * 60 * 60 * 1000);
```

### 12.12 WhatsApp Message Templates (Exact Strings)
```typescript
const WHATSAPP_TEMPLATES = {
  ACCEPTED: (riderName, orderId) =>
    `Hello! I am ${riderName}, your delivery partner for Foodhubbie order #${orderId}. I am on my way to pick up your order! 🛵`,
  
  PICKED_UP: (riderName, riderPhone, orderId) =>
    `Great news! I have picked up your order #${orderId}. If you need anything, you can call me at ${riderPhone}. I am on my way! 🍕🎂`,
  
  REACHED_DROP: (orderId) =>
    `I have arrived at your drop location with your order #${orderId}! Please have your 4-digit OTP ready. ✅`,
  
  SEND_OTP: (orderId, otp) =>
    `Your Foodhubbie order #${orderId} has arrived! 📍 \n\nTo safely receive your order, please provide this 4-digit OTP to the rider: *${otp}* ✅`,
  
  ARRIVED: (orderId) =>
    `I have arrived with your order #${orderId}! Please have your 4-digit OTP ready. ✅`
};

// Send via bot/{bid}/{oid}/commands node (WhatsApp bot picks up from there):
const cmdRef = ref(db, `bot/${bid}/${oid}/commands`);
push(cmdRef, {
  action: "SEND_GENERIC_MESSAGE",
  phone: cleanPhone,
  message: template,
  timestamp: serverTimestamp()
});
```

### 12.13 Nuclear Refresh (`completeSiteRefresh`)
```typescript
async function completeSiteRefresh() {
  // 1. Unregister all service workers (with 2s timeout)
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) await reg.unregister();

  // 2. Clear all caches (with 2s timeout)
  const keys = await caches.keys();
  for (const key of keys) await caches.delete(key);

  // 3. Clear localStorage active state
  localStorage.removeItem('activeOrderId');
  localStorage.removeItem('activeOrderData');
  sessionStorage.clear();

  // 4. Force reload with cache-busting params
  const cleanUrl = window.location.origin + window.location.pathname;
  window.location.href = `${cleanUrl}?v=${Date.now()}&sync=${Math.random().toString(36).substring(7)}`;
}
```

### 12.14 Slide-to-Action (Zomato-style) Pattern
The slide-to-action uses pointer events (both mouse and touch) with a draggable handle. When the handle reaches 80% of the container width, the action fires. On release before 80%, it springs back.

For React, implement with `framer-motion` drag:
- Container with `onDrag` handler tracking `x` position
- Handle slides within container bounds
- Background fill expands proportionally to handle position
- On drag end, if `x > 80%` of max → execute action, else spring back to 0
- Haptic feedback every 60px during drag

### 12.15 New Order Ping Modal Pattern
```typescript
// When a new unassigned order appears within proximity:
// 1. Play alert.mp3 audio
// 2. Vibrate device: navigator.vibrate([100, 50, 100, 50, 200])
// 3. Show full-screen modal with:
//    - Outlet name
//    - Customer address (glass panel)
//    - Estimated earning
//    - 30-second circular countdown timer (setInterval 1s)
// 4. On ACCEPT: hide modal, call acceptOrder(id, outletId)
// 5. On SKIP: add to ignoredPings Set, hide modal, render next
// 6. On timer expire: auto-skip
// 7. Track ignored pings in a Set to avoid re-pinging same order
```

### 12.6 Confetti on Delivery Complete
```typescript
import confetti from 'canvas-confetti';

confetti({
  particleCount: 150,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#FF5200', '#FF7A00', '#22C55E'] // Orange + Green
});
```

### 12.16 Haversine Distance Calculation (Proximity)
```typescript
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns distance in km
}
```

### 12.17 Route Optimization (Nearest-Neighbor)
```typescript
function optimizeRoute(startCoords: LatLng, stops: Stop[]): Stop[] {
  const unvisited = [...stops];
  const route: Stop[] = [];
  let current = startCoords;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
      if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
    }
    route.push(unvisited.splice(nearestIdx, 1)[0]);
    current = route[route.length - 1];
  }
  return route;
}
// Button visible when rider has ≥ 2 active orders
```

### 12.18 Firebase Connection Monitoring
```typescript
// Monitor `.info/connected` for real-time connection status
onValue(ref(db, '.info/connected'), (snap) => {
  if (snap.val() === true) {
    showToast("Connection Restored", "success");
  } else {
    showToast("Connection Lost. Reconnecting...", "warning");
  }
});
```

### 12.19 Haptic Feedback
```typescript
// Utility for all user actions
function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
// Usage: haptic(40) for button tap, haptic([100, 50, 200]) for alerts
```

---

## 13. CLAUDE CODE PROMPT — BUILD INSTRUCTIONS

Copy and use this entire document as a single prompt with Claude Code. The following commands set up the project:

### Step 1: Create & Configure Project
```bash
# Navigate to monorepo
cd D:\Foodhubbie

# Create RiderApp directory (replaces existing vanilla JS version)
mkdir RiderApp
cd RiderApp

# Initialize Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# Install ALL dependencies
npm install react@19.1.0 react-dom@19.1.0
npm install firebase@^12.13.0
npm install wouter@^3.3.5
npm install @tanstack/react-query@^5.80.6
npm install react-leaflet@1.9.4 leaflet
npm install recharts@^2.15.2
npm install lucide-react@^0.509.0
npm install sonner@^2.0.7
npm install framer-motion@^12.9.4
npm install date-fns@^3.6.0
npm install canvas-confetti@^1.9.3
npm install react-hook-form@^7.55.0 zod@^3.25.11 @hookform/resolvers@^3.10.0
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-sheet @radix-ui/react-avatar
npm install @radix-ui/react-badge @radix-ui/react-button @radix-ui/react-card
npm install @radix-ui/react-input @radix-ui/react-progress
npm install @radix-ui/react-scroll-area @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
npm install vaul

# Install dev deps
npm install -D typescript@~5.9.2 @types/react@^19.1.4 @types/react-dom@^19.1.5
npm install -D vite@^6.3.5 @vitejs/plugin-react@^4.5.2
npm install -D tailwindcss@^4.1.7 @tailwindcss/vite@^4.1.7
npm install -D @tailwindcss/typography@^0.5.15 tw-animate-css@^1.4.0
npm install -D @types/node@^22.15.17

# Copy assets
cp ../RiderApp/assets/sounds/alert.mp3 src/assets/sounds/alert.mp3

# Update firebase.json rider hosting target from "RiderApp" to "RiderApp/dist"
```

### Step 2: Configure shadcn/ui
```bash
npx shadcn@latest init
```
Use these settings:
- Style: New York
- Base color: Orange (or Slate — we'll override with our CSS variables)
- CSS variables: Yes
- Components: Select all: avatar, badge, button, card, dialog, input, progress, scroll-area, sheet, skeleton, switch, table, tabs, toast, toaster, tooltip

### Step 3: Build the Application
Build EVERY file listed in the directory structure (Section 4). Each file must be FULLY implemented — no placeholders, no TODOs, no stubs.

### Step 4: Verify
```bash
npm run dev    # Should start on port 5174
npm run build  # Should output to dist/
```

---

## 14. IMPORTANT RULES

- EVERY file must be fully coded — no placeholders, no "// TODO", no stubs
- Use lucide-react for ALL icons
- Use the vibrant orange #FF5200 color scheme (LIGHT MODE ONLY — no dark mode)
- Use GlassCard components with `backdrop-filter: blur(12px)`
- All modals should be bottom sheets (mobile-first design)
- Bottom navigation has 4 tabs: HOME, PICKUP, LIVE, WALLET
- Dashboard stat cards are SOLID colored (green, blue, orange, gold)
- The ping modal is FULL-SCREEN with a circular 30-second countdown timer
- The success overlay fires confetti animation automatically
- Online/Offline toggle in header with green/gray pulse dot
- All amounts formatted as ₹ with Indian number formatting (e.g., ₹1,234.56)
- Relative timestamps (2m ago, 1h ago, yesterday)
- Toast notifications for all action feedback (accept success/fail, errors)
- Every action must have loading, success, and error states
- Confirm dialogs for destructive actions
- Service worker for offline support + push notifications
- All Firebase operations use the modular SDK (not compat)
- Use `runTransaction` for order acceptance and wallet updates (atomic operations)
- Write both `deliveryOTP` and `otp` fields when setting OTP (legacy compatibility)
- GPS location syncs every 10 seconds when rider is Online
- Proximity check values: 1km for accept/outlet, 300m for pickup, 1km default for drop
- WhatsApp messages go to `bot/{bid}/{oid}/commands` node (NOT botCommands)
- OTP rate limit: 10 failed attempts → 60-second block
- Always clean up listeners on logout using `off()` from Firebase

---

## 15. VERSION HISTORY

| Version | Date | Description |
|---|---|---|
| 2.0.0 | 2026-05-24 | Enhanced PRD — added 19 implementation patterns from legacy app.js, removed dark mode, fixed Firebase paths |

---

## 16. FILE LOCATIONS REFERENCE

The rider app will be built at: `D:\Foodhubbie\RiderApp\` (replacing the existing vanilla JS version)

After build, update Firebase hosting target in `D:\Foodhubbie\firebase.json`:
```json
{
  "target": "rider",
  "public": "RiderApp/dist"   // Change from "RiderApp" to "RiderApp/dist"
}
```

---

**END OF RIDER APP MASTER PRD + PROMPT DOCUMENT**
