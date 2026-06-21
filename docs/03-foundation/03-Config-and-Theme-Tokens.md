# Config & Theme Tokens — Global Constants

**Source**: `config/index.js`, `config/constants.js` (131 lines), `config/firebase-config.js` (32 lines), `config/theme-tokens.js` (114 lines)  
**Workspace**: `@foodhubbie/config` (npm workspace)  
**Consumed by**: All apps via npm workspace or direct import

---

## 1. Code-Logics

### `config/constants.js` — Global Constants

**Brand Identity:**
```javascript
FOODHUBBIE.brand = {
  name: "Foodhubbie",
  tagline: "Your Neighbourhood Food Hub",
  logo: "/assets/foodhubbie-logo.svg",
  version: "1.0.0"
}
```

**SaaS Configuration:**
```javascript
FOODHUBBIE.saas = {
  maxOutletsPerBusiness: 50,
  defaultDeliveryRadiusKm: 15,
  orderAutoCancel_hours: 5,
  riderHeartbeat_seconds: 30,
  botSessionTimeout_minutes: 30,
  otpLength: 4,
  maxQuantityPerItem: 50,
  gstPercent: 5,
  platformFeePercent: 2
}
```

**Default Delivery Fee Slabs:**
```javascript
FOODHUBBIE.defaultDeliveryFeeStructure = [
  { upToKm: 2, fee: 20 },
  { upToKm: 5, fee: 35 },
  { upToKm: 10, fee: 50 },
  { upToKm: 15, fee: 70 }
]
```

**Status Pipelines:**
```javascript
orderStatuses: ["Placed","Confirmed","Preparing","Cooked","Ready",
                 "Out for Delivery","Reached Drop Location","Delivered","Cancelled"]
riderStatuses: ["ASSIGNED","PICKED_UP","REACHED","DELIVERED"]
botSteps: ["START","CATEGORY","DISH","SIZE","ADDONS","QUANTITY",
           "CART_VIEW","LOCATION","REUSE_PROFILE","CONFIRM_PAY","PLACE_ORDER"]
```

### `config/firebase-config.js` — Firebase Credentials

```javascript
FOODHUBBIE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W"
}
RECAPTCHA_SITE_KEY = "6LeblvYsAAAAAPhR4Uw4kHZLsW50dxE8o2D2XIo3"
FIREBASE_DATABASE_URL = "https://food-hubbie-default-rtdb.firebaseio.com"
```

### `config/theme-tokens.js` — Per-App + Per-Tenant Palettes

**4 App Defaults** (HSL strings):

| App | Primary | Secondary/CTA | Background | Font |
|---|---|---|---|---|
| marketplace | `160 91% 20%` (Forest Green) | `38 92% 50%` (Amber) | `48 100% 97%` (Cream) | Plus Jakarta Sans / Syne |
| rider | `16 100% 50%` (Orange) | `0 84% 60%` (Red) | `210 17% 96%` | Outfit |
| admin | `222 47% 11%` (Slate) | `142 71% 45%` (Green) | `210 40% 98%` | Satoshi / General Sans |
| supreme | `222 47% 11%` (Slate) | `142 71% 45%` (Green) | `210 40% 98%` | Satoshi / General Sans |

**2 Tenant Overrides:**
```javascript
tenants: {
  business_roshani:  { primary: "160 91% 20%", secondary: "38 92% 50%", brandName: "Roshani Pizza", logoText: "RP" },
  business_prashant: { primary: "16 100% 50%", secondary: "38 92% 50%", brandName: "Prashant Pizza", logoText: "PP" }
}
```

**Resolver:**
```javascript
function resolveMarketplaceTheme(businessId) {
  const base = { ...TOKENS.marketplace };
  const override = TOKENS.tenants[businessId];
  return override ? { ...base, ...override } : base;
}
```

---

## 2. Firebase-Rules

No Firebase access. Pure configuration.

---

## 3. Database-Structure

No database storage. Configuration is compiled into each app at build time or read from Firebase at runtime (bot settings from `businesses/{bid}/outlets/{oid}/settings/`).

---

## 4. Connecting-Nodes

```
[Marketplace boots]
  -> src/main.tsx: applyTheme() with defaults from theme-tokens.js
  -> User navigates to /store/:slug
  -> OutletDetails fetches meta -> calls getThemeForTenant(outlet.businessId)
  -> applyTheme(theme) -> sets CSS variables on :root

[Bot boots]
  -> Reads FOODHUBBIE_FIREBASE_CONFIG from config/firebase-config.js
  -> Initializes firebase-admin with FIREBASE_DATABASE_URL
  -> Reads defaultDeliveryFeeStructure from constants.js as fallback
  -> Per-order: reads actual fee slabs from businesses/{bid}/outlets/{oid}/settings/Delivery
```

---

## 5. Complete Flow: Theme Application

1. Marketplace loads → `applyTheme()` sets default Forest Green palette
2. User searches for "Roshani Pizza" → clicks outlet
3. URL resolves to `/store/roshani-pizza` → `Outlets.jsx` fetches slug → `outletService.fetchOutletBySlug()`
4. Response includes `businessId: "business_roshani"`
5. `useEffect` calls `getThemeForTenant("business_roshani")` → merges default marketplace palette with `{ primary: "160 91% 20%", brandName: "Roshani Pizza" }`
6. `applyTheme(effectiveTheme)` updates CSS variables → UI reflects Roshani branding
7. Adding a new tenant: one object literal in `config/theme-tokens.js:tenants`
