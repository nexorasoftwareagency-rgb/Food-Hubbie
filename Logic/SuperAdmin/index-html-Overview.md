# SuperAdmin — index.html Overview

## File
- **index.html** — 1766 lines
- SPA shell for entire CRM dashboard

## Document Structure
```
<!DOCTYPE html>
<html>
  <head>
    Meta tags (charset, viewport, title)
    style.css stylesheet
    CDN dependencies (6):
      - Lucide Icons
      - Firebase App Compat 9.6.1
      - Firebase Database Compat 9.6.1
      - Firebase Auth Compat 9.6.1
      - Firebase Storage Compat 9.6.1
      - OTPAuth 9.2.2
      - QRCode.js 1.0.0
      - Chart.js
      - SweetAlert2 11
  </head>
  <body>
    Auth Gateway (#loginOverlay)             ← 45 lines
    2FA Modal (#tfaModal)                    ← 23 lines
    Master Layout (#mainContainer)           ← 1650+ lines
      ├─ Sidebar (.pro-sidebar)              ← 85 lines
      ├─ Main Surface (.pro-main)            ← 1550+ lines
      │   ├─ Header (.pro-header)            ← 16 lines
      │   └─ 17 Tab Panes (.tab-pane)
      └─ Modals (8)
    js/main.js script
  </body>
</html>
```

## CDN Loading Order
| Order | Library | Version | Purpose |
|---|---|---|---|
| 1 | Lucide Icons | latest | SVG icons |
| 2 | Firebase App Compat | 9.6.1 | Firebase core |
| 3 | Firebase Database Compat | 9.6.1 | RTDB operations |
| 4 | Firebase Auth Compat | 9.6.1 | Authentication |
| 5 | Firebase Storage Compat | 9.6.1 | File upload |
| 6 | OTPAuth | 9.2.2 | TOTP verification |
| 7 | QRCode.js | 1.0.0 | QR code rendering |
| 8 | Chart.js | latest | Revenue chart |
| 9 | SweetAlert2 | 11 | Confirmation dialogs |

js/main.js is loaded after all CDNs at the bottom of `<body>`. html2pdf.js loaded on-demand in Reports tab (not in `<head>`).

## Auth Gateway (#loginOverlay)
```
Fixed fullscreen overlay with gradient background
  ├─ Auth card (.auth-card):
  │   ├─ Logo: shield-check icon + "PRO CONSOLE"
  │   ├─ Title: "Enterprise Access"
  │   ├─ Subtitle: "Master administrative node initialization required"
  │   ├─ Form (#loginForm):
  │   │   ├─ Email input (#loginEmail)
  │   │   └─ Password input (#loginPassword)
  │   ├─ Submit button: "INITIALIZE SESSION"
  │   └─ Error display (#loginError, hidden by default)
  └─ Hidden class toggled by checkAuth() on successful login
```

## 2FA Modal (#tfaModal)
```
Same overlay pattern as login
  ├─ Shield icon + "2FA Verification"
  ├─ Instruction text
  ├─ Form (#tfaForm):
  │   ├─ 6-digit code input (#tfaCode, monospace, centered)
  │   └─ Submit button: "VERIFY CODE"
  ├─ Error display (#tfaError)
  └─ Helper text about authenticator apps
```

## Master Layout (#mainContainer)
Initially hidden (`class="hidden"`), shown after successful auth + TFA verification.

### Sidebar
```
Fixed left sidebar (250px)
  ├─ Logo: shield-check + "FOODHUBBIE PRO"
  ├─ Navigation (4 nav groups):
  │   ├─ "Ecosystem Overview" group:
  │   │   ├─ Ecosystem Overview (dashboard)
  │   │   ├─ Partner Requests (onboarding) + badge
  │   │   ├─ Financial Recon (reconciliation)
  │   │   ├─ Managed Entities (businesses)
  │   │   ├─ Outlet Profiles (outlets)
  │   │   ├─ Global Analytics (analytics)
  │   │   ├─ Rider Management (riders)
  │   │   ├─ Service Slabs (delivery)
  │   │   ├─ Inventory Control (inventory)
  │   │   ├─ Promotions Center (promotions)
  │   │   └─ User Registry (users)
  │   ├─ "Growth & Engagement" group:
  │   │   ├─ Live Orders (liveorders)
  │   │   ├─ Ratings & Reviews (reviews)
  │   │   └─ Broadcast Center (broadcast)
  │   └─ "System Core" group:
  │       ├─ Security Audit (audit)
  │       ├─ Ecosystem Reports (reports)
  │       └─ Infrastructure (settings)
  └─ Profile section (.pro-profile):
      ├─ Avatar initials
      ├─ Name / "Master Session"
      ├─ Role badge (#adminRoleBadge)
      └─ Logout icon
```

### Header
```
.pro-header
  ├─ Left: #tabTitle (h1) + #tabSubtitle (p)
  └─ Right:
      ├─ #systemStatus badge (green "System Online")
      ├─ Reload button (location.reload)
      └─ "Provision Node" button (showOnboarding)
```

### Tab Panes
Each tab pane has `id="tabname"` and `class="tab-pane"`. Only one tab pane has `class="tab-pane active"` at a time (default: `dashboard`). Tab switching removes `.active` from all panes and adds it to the target.

### Modals (8)
| Modal | ID Pattern | Trigger | Content |
|---|---|---|---|
| Login | `#loginOverlay` | Page load | Email + password |
| 2FA | `#tfaModal` | Auth success | 6-digit TOTP |
| Outlet Profile | `#outletProfileModal` | Profile button | Read-only analytics |
| Outlet Edit | `#outletModal` (inline) | Edit button | Pre-filled form |
| Rider Edit | `#riderModal` (inline) | Add/Edit rider | Form + KYC uploads |
| Coupon Create | `#couponModal` (inline) | Generate Code | Coupon fields |
| Wallet Credit | `#walletModal` (inline) | Wallet button | Amount + reason |
| Commission Edit | `#modalCommission` (inline) | Commission button | % + fixed fee |

Modals are inline HTML in index.html, shown/hidden via CSS `hidden` class. No modal library used — custom overlay + content pattern.

## CSP Headers
- **None present** — No `<meta http-equiv="Content-Security-Policy">` tag. This means all CDN scripts load without restriction but also no XSS protection at the browser level.

## Key HTML Patterns
- `onsubmit="event.preventDefault(); functionName()"` on all forms (login, TFA, onboarding, broadcast)
- `onclick` on all buttons and interactive elements
- `data-tab="tabname"` on nav-links for routing
- `hidden` CSS class for visibility toggling
- `lucide.createIcons()` called after every dynamic HTML injection
