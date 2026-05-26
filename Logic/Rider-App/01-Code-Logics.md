# Rider App — Code Logics

## Overview
Vanilla JS SPA for delivery riders. Firebase-powered with real-time order management, GPS tracking, and offline support.

## Architecture
- **index.html** (654 lines) — SPA shell with 7 inline `<section>` views + modals
- **app.js** (3031 lines, ES Module) — All application logic, global `window.*` pattern for HTML event handlers
- **style.css** (3979 lines) — Full design system with glassmorphism, orange theme (#FF5200)
- **sw.js** (124 lines) — Service Worker for offline + push notifications
- **firebase-messaging-sw.js** — FCM background handler

## Views (7 inline sections)
| ID | Tab | Content |
|---|---|---|
| `sec-home` | Dashboard | Welcome, today's stats (delivered, on-time %, earnings, rating), active delivery card |
| `sec-available` | Pickup | Unassigned orders available to accept |
| `sec-active` | Live Trip | Map + step progress + slide-to-action |
| `sec-completed` | History | Past deliveries with order ID search |
| `sec-ledger` | Ledger | Wallet balance, today's earning, pending settlement, transaction history |
| `sec-earnings` | Stats | Today's earnings hero, cash to settle, weekly chart, shop breakdown |
| `sec-profile` | Profile | Photo upload, personal details, aadhar image |

## Modals & Overlays
| Element | Purpose |
|---|---|
| `#auth-section` | Login form (mobile/email + password) |
| `#verificationModal` | Order item checklist before pickup |
| `#otpPanel` | 4-digit delivery OTP entry |
| `#paymentPanel` | Cash or UPI collection |
| `#confirmModal` | Generic confirm/cancel dialog |
| `#notificationSheet` | Slide-in notification list |
| `#newOrderPingModal` | Incoming order alert with 30s countdown |
| `#settlementModal` | Past cash settlement records |
| `#successOverlay` | Post-delivery success with confetti |
| `#syncStatus` | Connection/sync indicator |
| `#offlineIndicator` | Offline queue status bar |

## Key Design Patterns
- **Global functions on `window`** — `window.showView()`, `window.acceptOrder()`, etc. for inline HTML `onclick`
- **DOM manipulation** — `innerHTML`, `classList`, `style.display` toggling
- **Event delegation** — `document.querySelector('[data-action]')` pattern
- **No framework** — pure vanilla JS
- **Module type** — `<script type="module">` for import/export
- **Cache-busting** — `?v=4.7.1` on CSS/JS assets

## Firebase SDKs (v10.7.1, CDN)
- `firebase-app.js` — Initialization
- `firebase-auth.js` — Email/password auth
- `firebase-database.js` — Real-time database
- `firebase-storage.js` — Profile photo upload
- `firebase-messaging.js` — Push notifications
