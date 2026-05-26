# Foodhubbie — Technology Stack

## Platform Overview

```
Monorepo:     foodhubbie-saas (npm workspaces)
Firebase:     food-hubbie (project ID)
Cloud:        Firebase (Hosting, Auth, RTDB, Storage, Functions, Firestore)
Domain:       foodhubbie-admin.web.app (admin dashboard)
```

---

## 1. Admin Dashboard (`admin-dashboard/`)

**Type**: SPA — React 19 + Vite 8
**Build**: `npx vite build` → `dist/` → Firebase Hosting (`target: admin`)

### Core
| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2.6 | UI framework |
| React DOM | ^19.2.6 | DOM rendering |
| Vite | ^8.0.12 | Bundler + dev server |
| @vitejs/plugin-react | ^6.0.1 | React Fast Refresh |

### UI & Styling
| Technology | Version | Purpose |
|---|---|---|
| Tailwind CSS | ^4.3.0 | Utility-first CSS |
| @tailwindcss/vite | ^4.3.0 | Tailwind Vite plugin |
| lucide-react | ^1.16.0 | Icon library |
| recharts | ^3.8.1 | Charts (Area, Bar, Pie) |
| chart.js | ^4.5.1 | Charts (fallback) |
| react-chartjs-2 | ^5.3.1 | React wrapper for Chart.js |

### Firebase
| Technology | Version | Purpose |
|---|---|---|
| firebase | ^12.13.0 | Firebase JS SDK (Auth, RTDB, Storage) |

### Other
| Technology | Version | Purpose |
|---|---|---|
| leaflet | ^1.9.4 | Map (Live Tracker — dynamic import, not in bundle) |
| react-router-dom | ^7.15.1 | Router (installed but NOT used — app uses PAGES object) |

### Dev Dependencies
| Technology | Version | Purpose |
|---|---|---|
| eslint | ^10.3.0 | Linting |
| @eslint/js | ^10.0.1 | ESLint config |
| eslint-plugin-react-hooks | ^7.1.1 | React hooks rules |
| eslint-plugin-react-refresh | ^0.5.2 | HMR rules |
| @types/react | ^19.2.14 | TypeScript types (not used in source) |
| @types/react-dom | ^19.2.3 | React DOM types |
| globals | ^17.6.0 | ESLint globals |
| tailwindcss | ^4.3.0 | CSS framework |

---

## 2. Marketplace (`Marketplace/`)

**Type**: PWA — React 19 + Vite 6 + TypeScript
**Build**: `npx vite build --config vite.config.ts` → `dist/` → Firebase Hosting (`target: marketplace`)
**Description**: Zomato-style food ordering frontend for customers

### Core
| Technology | Version | Purpose |
|---|---|---|
| React | ^19.1.0 | UI framework |
| React DOM | ^19.1.0 | DOM rendering |
| TypeScript | ~5.9.2 | Static typing |
| Vite | ^6.3.5 | Bundler |
| @vitejs/plugin-react | ^4.5.2 | React Fast Refresh |
| wouter | ^3.3.5 | Lightweight router |

### UI & Styling
| Technology | Version | Purpose |
|---|---|---|
| Tailwind CSS | ^4.1.7 | Utility-first CSS |
| @tailwindcss/vite | ^4.1.7 | Tailwind Vite plugin |
| @tailwindcss/typography | ^0.5.15 | Typography plugin |
| tw-animate-css | ^1.4.0 | Animation utilities |
| tailwind-merge | ^3.3.0 | Class merge utility |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Class name builder |
| lucide-react | ^0.509.0 | Icon library |
| react-icons | ^5.4.0 | Extended icons |
| framer-motion | ^12.9.4 | Animations |
| recharts | ^2.15.2 | Charts |
| sonner | ^2.0.7 | Toast notifications |
| vaul | ^1.1.2 | Drawer component |

### Radix UI Primitives (24 packages)
Accordion, AlertDialog, AspectRatio, Avatar, Checkbox, Collapsible, ContextMenu, Dialog, DropdownMenu, HoverCard, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Slider, Slot, Switch, Tabs, Toast, Toggle, ToggleGroup, Tooltip

### Forms & Validation
| Technology | Version | Purpose |
|---|---|---|
| react-hook-form | ^7.55.0 | Form state management |
| @hookform/resolvers | ^3.10.0 | Schema resolvers |
| zod | ^3.25.11 | Schema validation |
| input-otp | ^1.4.2 | OTP input |

### Utilities
| Technology | Version | Purpose |
|---|---|---|
| @tanstack/react-query | ^5.80.6 | Server state management |
| date-fns | ^3.6.0 | Date utilities |
| react-day-picker | ^9.11.1 | Date picker |
| embla-carousel-react | ^8.6.0 | Carousel/slider |
| cmdk | ^1.1.1 | Command palette |
| react-resizable-panels | ^2.1.7 | Resizable panels |

### Firebase
| Technology | Version | Purpose |
|---|---|---|
| firebase | ^12.13.0 | Firebase JS SDK |

---

## 3. Bot (`bot/`)

**Type**: Node.js 18+ — CommonJS — WhatsApp bot engine
**Runtime**: EC2 (Ubuntu) + PM2
**Process**: `pm2 start index.js --name status-monitor`

### Core
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| @whiskeysockets/baileys | ^6.7.17 | WhatsApp Web API (multi-device) |
| firebase-admin | ^13.10.0 | Firebase Admin SDK (server-side) |
| pino | ^9.6.0 | Logging |
| qrcode-terminal | ^0.12.0 | QR display in terminal |

### Architecture
- `index.js` — Entry + WhatsApp auth + Baileys socket init
- `status-monitor.js` — Real-time order listener, 8 status handlers, rider broadcast, OTP generation
- `commands.js` — WhatsApp command handler for order/status conversation
- `whatsapp-engine.js` — Baileys WhatsApp library wrapper
- `firebase.js` — Firebase admin init (uses shared helpers)
- Deployed on EC2, managed via PM2

---

## 4. Rider App (`RiderApp/`)

**Type**: Vanilla HTML/CSS/JS SPA
**Hosting**: Firebase Hosting (`target: rider`)
**Structure**: Single `index.html` (~654 lines) + inline CSS + Firebase CDN

### Technologies
| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Structure |
| CSS3 (inline) | — | Styling |
| Vanilla JS | ES6+ | Logic |
| Firebase Auth (CDN) | compat v9 | Auth |
| Firebase RTDB (CDN) | compat v9 | Realtime data |

---

## 5. SuperAdmin (`SuperAdmin/`)

**Type**: Vanilla HTML/CSS/JS SPA
**Hosting**: Firebase Hosting (`target: superadmin`)
**Description**: Enterprise Control Center

### Technologies
| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Structure |
| CSS3 (separate `style.css`) | — | Styling |
| Vanilla JS | ES6+ | Logic |
| Firebase Auth (CDN) | compat v9.6.1 | Auth |
| Firebase RTDB (CDN) | compat v9.6.1 | Realtime data |
| Firebase Storage (CDN) | compat v9.6.1 | File storage |
| lucide (CDN) | latest | Icons |
| Chart.js (CDN) | latest | Charts |
| otpauth (CDN) | ^9.2.2 | OTP auth |
| qrcodejs (CDN) | ^1.0.0 | QR code generation |

---

## 6. SupremeAdmin (`SupremeAdmin/`)

**Type**: Vanilla HTML/CSS/JS SPA
**Hosting**: Firebase Hosting (`target: supreme`)
**Description**: Top-level system administration

### Technologies
| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Structure |
| CSS3 (separate `style.css`) | — | Styling |
| Vanilla JS | ES6+ | Logic |
| Firebase Auth (CDN) | compat v11.4.0 | Auth |
| Firebase RTDB (CDN) | compat v11.4.0 | Realtime data |
| Firebase Firestore (CDN) | compat v11.4.0 | Document store |
| Firebase Functions (CDN) | compat v11.4.0 | Callable functions |
| lucide (CDN) | ^0.468.0 | Icons |
| Chart.js (CDN) | ^4.4.7 | Charts |

---

## 7. Shared Packages

### `shared/` — `@foodhubbie/shared`
Shared Firebase helpers and utilities:
| File | Purpose |
|---|---|
| `firebase-helpers.js` | `resolvePath()`, `createFirebaseOps()`, cache layer |
| `utils.js` | `calculateDistance` (Haversine), `formatJid`, `generateOTP`, `timeAgo`, `isShopOpen`, `currency` |
| `push-notifications.js` | `sendPushNotification()`, `notifyAdmins()` FCM dispatcher |

### `config/` — `@foodhubbie/config`
Global configuration and constants

---

## 8. Firebase Infrastructure

### Services Used
| Service | Usage |
|---|---|
| **Authentication** | Email/Password (admin login) |
| **Realtime Database** | All app data (orders, dishes, riders, customers, settings) |
| **Cloud Storage** | Dish images, receipt files |
| **Cloud Functions** | SupremeAdmin only (compat) |
| **Cloud Firestore** | SupremeAdmin only (compat) |
| **Firebase Hosting** | 5 targets: marketplace, admin, rider, superadmin, supreme |

### Hosting Targets (from `firebase.json`)
| Target | Source Dir | URL |
|---|---|---|
| `marketplace` | `Marketplace/dist` | foodhubbie-marketplace.web.app |
| `admin` | `admin-dashboard/dist` | foodhubbie-admin.web.app |
| `rider` | `RiderApp/` | foodhubbie-rider.web.app |
| `superadmin` | `SuperAdmin/` | foodhubbie-superadmin.web.app |
| `supreme` | `SupremeAdmin/` | foodhubbie-supremeadmin.web.app |

### Database
- **Type**: Firebase Realtime Database
- **URL**: `food-hubbie-default-rtdb.firebaseio.com`
- **Rules**: `database.rules.json` at project root
- **Structure**: `businesses/{bizId}/outlets/{outletId}/{collections}`

---

## 9. Deployment Stack

| Layer | Technology |
|---|---|
| **Version Control** | Git (GitHub) |
| **Frontend Build** | Vite 6/8 |
| **Frontend Hosting** | Firebase Hosting (CDN, SSL, rewrites) |
| **Backend Runtime** | Node.js 18+ (Bot only) |
| **Backend Hosting** | AWS EC2 (Ubuntu) |
| **Process Manager** | PM2 |
| **Database** | Firebase Realtime Database |
| **Auth** | Firebase Auth (Email/Password) |
| **File Storage** | Firebase Cloud Storage |
| **Notifications** | Firebase Cloud Messaging (via FCM dispatcher) |

---

## 10. Development Tooling

| Tool | Purpose |
|---|---|
| npm workspaces | Monorepo management |
| ESLint 10 | Code linting (admin-dashboard) |
| TypeScript 5.9 | Static typing (Marketplace only) |
| Tailwind CSS v4 | Styling (admin-dashboard, Marketplace) |
| Vite 6/8 | Dev server + bundler |
| React 19 | UI (admin-dashboard, Marketplace) |

---

## 11. Key Design Decisions by Stack

| Decision | Rationale |
|---|---|
| Admin Dashboard: React 19 + Vite 8 | Latest React for concurrent features; Vite for fast HMR |
| Admin Dashboard: No TypeScript | Rapid development; type errors found at runtime |
| Marketplace: TypeScript + Zod | Customer-facing app needs type safety and validation |
| Marketplace: wouter (not React Router) | Minimal router (~2KB) for a mostly-static app |
| Bot: CommonJS (not ESM) | Baileys and firebase-admin work better with CJS |
| Bot: EC2 (not Firebase Functions) | Long-running WebSocket connection (Baileys) needs persistent process |
| Rider/SuperAdmin/SupremeAdmin: Vanilla JS | Simple apps; no build step needed; direct Firebase CDN |
| Rider/SuperAdmin/SupremeAdmin: Firebase compat CDN | No bundler; works directly in browser <script> tags |
| Monorepo: npm workspaces | Shared config and utilities across packages |
