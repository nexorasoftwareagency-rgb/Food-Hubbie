# Foodhubbie Rider App — Delivery Partner Manual

## Table of Contents
1. [Overview & Getting Started](#1-overview--getting-started)
2. [Login & Authentication](#2-login--authentication)
3. [Dashboard (Home Tab)](#3-dashboard-home-tab)
4. [Online/Offline Status](#4-onlineoffline-status)
5. [Pickup Tab — Available Orders](#5-pickup-tab--available-orders)
6. [Accepting an Order](#6-accepting-an-order)
7. [Live Tab — Active Delivery Map](#7-live-tab--active-delivery-map)
8. [4-Step Delivery Workflow](#8-4-step-delivery-workflow)
9. [Payment Collection](#9-payment-collection)
10. [Completion & Confetti](#10-completion--confetti)
11. [Trip History](#11-trip-history)
12. [Earnings Ledger](#12-earnings-ledger)
13. [Earnings Dashboard](#13-earnings-dashboard)
14. [Profile & Settings](#14-profile--settings)
15. [Notifications](#15-notifications)
16. [Offline Mode & Action Queue](#16-offline-mode--action-queue)
17. [Pull-to-Refresh & App Reset](#17-pull-to-refresh--app-reset)
18. [Install as PWA](#18-install-as-pwa)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Overview & Getting Started

### What is the Rider App?
The Rider App is a mobile-first delivery portal for Foodhubbie riders. It handles the complete delivery lifecycle: accept orders, navigate to outlets and customers, verify items, collect OTPs, process payments, and track earnings.

### System Requirements
- Modern smartphone or tablet (Android via Chrome, iOS via Safari)
- GPS location must be enabled
- Internet connection (offline queue available for brief disconnections)
- Push notifications enabled (recommended)

### First-Time Setup
1. Your admin creates a rider account in the SuperAdmin panel
2. You receive your login email (usually your phone number) and temporary password
3. Open the Rider App URL in your browser
4. Log in with the provided credentials
5. Grant **location permission** when prompted (required for delivery proximity checks)
6. Grant **notification permission** when prompted (to receive new order pings)

---

## 2. Login & Authentication

### Login Screen
- **Login section** with premium dark glassmorphism design
- Enter your **Mobile Number** (10 digits) or **Email**
- Enter your **Password** (toggle eye icon to reveal)
- Tap **"Sign In & Start Delivering"**

### How Login Works
- Phone numbers (10 digits) are auto-converted to email format for Firebase Auth
- Example: `9876543210` → `9876543210@rider.com`

### First Login
- Use the temporary password provided by your admin
- You may be prompted to change your password on first login

### After Login
- Your name appears in the welcome message
- Your rider ID (e.g., `RID-123456`) appears in the sidebar
- All real-time listeners start — orders, notifications, and location tracking
- You see the **Dashboard** with today's performance stats

---

## 3. Dashboard (Home Tab)

The **HOME** tab (bottom nav, first icon) is your command center.

### Welcome Message
- Displays "Good morning/afternoon/evening, [Your Name]"
- Shows today's date

### Today's Performance Cards
Four premium stat cards:

| Card | Color | Description |
|---|---|---|
| **Delivered** | Green | Number of deliveries completed today |
| **On-Time** | Blue | On-time delivery percentage (rating) |
| **Earnings** | Orange | Total earnings today in ₹ |
| **Rating** | Gold | Your average customer rating |

### Active Delivery View
- If you have an active delivery, a card appears showing:
  - Current step (ACCEPTED → PICKUP → TRANSIT → DROP)
  - Order information
  - Slide-to-action bar
- If no active delivery, a skeleton placeholder is shown

### View Detailed Stats
- Tap **"View Detailed Stats"** to jump to the full Earnings Dashboard (section 13)

---

## 4. Online/Offline Status

### Status Toggle
- Located in the **header** area
- Toggle between **ONLINE** (green pulsing dot) and **OFFLINE** (gray dot)

### Online Mode
- GPS location tracking starts (updates every 10 seconds)
- Your position is visible to the system for proximity matching
- You can receive new order pings and appear in the pickup list

### Offline Mode
- Location tracking stops
- You are invisible to dispatchers
- Existing active deliveries continue to work
- No new order pings

### Auto Offline
- If you lose internet connection or close the app abruptly, your status auto-switches to Offline via Firebase on-disconnect handler

---

## 5. Pickup Tab — Available Orders

The **PICKUP** tab (bottom nav, second icon) shows orders ready for delivery.

### How Orders Appear
- Orders appear when you are within **1km proximity** to the outlet
- Only orders with statuses `ready`, `cooked`, `packed`, `preparing`, or `confirmed` are shown
- Orders that are already assigned to another rider are hidden

### Order Card Information
- **Outlet Name** — Restaurant/business name
- **Customer Address** — Delivery destination
- **Estimated Earnings** — Delivery fee for this order
- **Order Items** — List of items in the order

### Proximity Requirement
- You must be within **1 kilometer** of the outlet to see and accept the order
- This ensures quick pickup times

---

## 6. Accepting an Order

There are two ways to accept an order:

### Method 1: Ping Modal (Automatic)
1. When an unassigned order is detected within 1km, a **New Order Ping Modal** appears automatically
2. The modal shows:
   - Outlet name
   - Customer address
   - Estimated earnings
   - **30-second countdown timer**
3. Tap **ACCEPT TASK** to take the order
4. Tap **SKIP** or let the timer expire to decline

### Method 2: Pickup List (Manual)
1. Navigate to the **PICKUP** tab
2. Browse available orders
3. Tap **ACCEPT** on any order

### After Acceptance
1. A **4-digit OTP** is auto-generated for delivery verification
2. A WhatsApp alert is sent to the customer: *"I am your delivery partner..."*
3. The order moves to your **Active Delivery** view
4. The 4-step progress indicator begins

### Important
- The system uses a **Firebase transaction** to ensure no two riders accept the same order
- If another rider already accepted it, you'll see an error

---

## 7. Live Tab — Active Delivery Map

The **LIVE** tab (bottom nav, third icon) provides real-time navigation.

### Map View
- Full-screen **Leaflet.js map**
- **Your location** — orange circle marker (updates every 10 seconds)
- **Customer drop location** — default map marker with address popup
- Map automatically **zooms to fit** both your location and the customer

### Active Task Card (Bottom Panel)
- Slide-up panel showing current delivery task
- Shows the **4-step progress indicator**
- Action slider for the current step

### Route Optimization (Multi-Order)
- If you have **2 or more** active orders, a **Route Optimization** button appears
- Tap it to calculate the most efficient stop order
- Uses nearest-neighbor algorithm starting from your current position

### Google Maps Navigation
- When you enter **TRANSIT** step, a "Navigate" link opens Google Maps with the customer's destination

---

## 8. 4-Step Delivery Workflow

Each delivery has 4 steps. You progress through them using **slide-to-action** bars.

### Step 1: ACCEPTED — "Heading to [Outlet Name]"

**Action:** Slide **"Slide to Reach Outlet"**

What happens:
- System checks you are within **1km of the outlet**
- Records `arrivedAtRestaurantAt` timestamp
- **Verify Items Modal** opens automatically

**Verify Items Modal:**
- Bottom-sheet checklist showing all order items
- Verify the items match the order before pickup
- Tap **"Confirm & Pick Up"** to proceed (this is Step 2)

---

### Step 2: PICKUP — "At Restaurant"

**Action:** Slide **"Slide to Pick Up"** (from the verification modal)

What happens:
- System checks you are within **300 meters** of the outlet
- Updates order status to **"Out for Delivery"**
- Records `pickedUpAt` timestamp
- Auto-switches to the **LIVE tab** (map view)
- WhatsApp alert sent: *"I have picked up your order..."*
- Google Maps navigation link becomes active

---

### Step 3: TRANSIT — "Delivering to [Customer Name]"

**Action:** Slide **"Slide to Reach Customer"**

What happens:
- System checks you are within **1km of the customer's location**
- Updates status to **"Reached Drop Location"**
- Records `reachedDropAt` timestamp
- **OTP Verification panel** opens automatically

---

### Step 4: DROP — "At Customer Location"

**Action:** Enter the **4-digit Delivery OTP**

What happens:
- Customer received the OTP via WhatsApp (and can read it to you)
- Open the OTP panel (opened automatically, or tap OTP button on active card)
- Enter the 4-digit code
- Tap **"Verify OTP"**

**OTP Rules:**
- 4-digit numeric code
- If OTP entry fails **10 times**, further attempts are blocked for **60 seconds**
- **Emergency Override**: If you are marked as admin, you can override the OTP requirement
- **Regenerate OTP**: Optional button to generate and send a new OTP

**On successful OTP:**
- The **Collect Payment** panel opens (see section 9)

---

## 9. Payment Collection

After OTP verification, the **Collect Payment** panel shows the amount to collect.

### Payment Methods
1. **Cash** — Collect payment in cash from the customer
2. **UPI** — Customer pays via UPI (no cash handling)

### Selecting a Method
- Tap **Cash** or **UPI**
- The system records the payment method
- Tapping either triggers `finalizeDeliverySequence()`

### What Finalize Does
1. Updates order status to **"Delivered"**
2. Records payment method on the order
3. Updates rider stats (delivery counter)
4. Creates **ledger entry** in your earnings ledger
5. Updates wallet balance
6. Shows **Success Overlay** with confetti (see section 10)

---

## 10. Completion & Confetti

After successful delivery completion:

### Success Overlay
- Full-screen celebration with **confetti animation**
- Shows:
  - **Payment method** used (Cash / UPI)
  - **Commission earned** (your delivery fee for this order)
- Auto-closes after **4 seconds**
- After close, you return to the **HOME tab** where your stats are updated

### Automatic WhatsApp Alert
A delivery confirmation message is sent to the customer via WhatsApp.

---

## 11. Trip History

### Accessing Trip History
- Open the **sidebar** (hamburger menu)
- Tap **"Trip History"**

### What You See
- All your delivered orders
- **Desktop**: Table view with columns
- **Mobile**: Card grid layout

### Searching
- Use the **search box** to filter by Order ID
- Results update in real-time as you type

### Information Displayed
- Order ID
- Date and time of delivery
- Customer destination
- Earnings for the order
- Delivery status

---

## 12. Earnings Ledger

### Accessing Ledger
- Tap the **WALLET** tab (bottom nav, fourth icon)

### What You See
- **Dark hero card** showing:
  - **Total Ledger Balance** — All-time earnings
  - **Today's Earnings** — Amount earned today
  - **Unsettled Cash** — Cash collected but not yet settled with admin

### Transaction History
- Real-time list of all delivery fee earnings
- Each entry shows:
  - **Timestamp** (e.g., "Today, 14:30")
  - **Amount** (color-coded: positive in green, negative in red)
- Updates automatically as new deliveries complete

---

## 13. Earnings Dashboard

### Accessing Full Dashboard
- Tap **"View Detailed Stats"** on the HOME tab
- Or tap **"Earnings Dashboard"** in the sidebar

### What You See

**Today's Hero:**
- Total earnings today
- Number of orders delivered today
- Online hours today

**Summary Grid:**
- **Cash to Settle** — Pending cash amount + "History" button
- **Weekly Target** — Progress bar toward your target

**Weekly Chart:**
- 7-bar chart (Monday to Sunday)
- Current day is highlighted
- Shows earnings per day for the current week

**Per-Outlet Breakdown:**
- Each outlet you've delivered for
- Lifetime earnings
- Today's earnings
- Order counts

**Settlement History Modal:**
- Tap "History" on the Cash to Settle card
- Shows past cash settlement records
- Includes: admin name, amount, number of orders, timestamp

---

## 14. Profile & Settings

### Accessing Profile
- Open the **sidebar** (hamburger menu)
- Tap **"My Profile"**

### Profile Photo
- Circular photo displayed at the top
- Tap the **camera button** to change photo
- Select an image from your device
- Image is compressed (< 200KB JPEG) and uploaded

### Personal Details
| Field | Editable? | How to Edit |
|---|---|---|
| Father's Name | No | Set by admin |
| Age | No | Set by admin |
| Aadhar Number | No (masked) | Last 4 digits shown |
| Qualification | No | Set by admin |
| Contact Phone | Yes | Tap → enter new number → page reloads |
| Address | Yes | Tap → enter new address → saved |
| Aadhar Image | No | Toggle show/hide to view |

### Sidebar Information
- Your **Name** at the top
- Your **Rider ID** (e.g., `RID-123456`)

### App Version
- Version `4.7.1` (displayed in the app footer)

---

## 15. Notifications

### Notification Bell
- **Header icon** (bell) shows **unread count badge**
- Tap to open the **Notification Sheet**

### Notification Sheet
- Slides in from the right side
- Each notification shows:
  - **Icon** (info / success / warning)
  - **Title**
  - **Message body**
  - **Timestamp**
  - **Read/Unread** state (unread = bolder)
- Tap a notification to mark it as read

### Clear All
- Tap **"Clear All"** to remove all notifications

### Push Notifications
- When the app is in the background, native push notifications appear
- Tapping a notification opens the app
- Foreground notifications appear as in-app toasts with sound

---

## 16. Offline Mode & Action Queue

### When Offline
The app detects internet disconnection automatically.

### What Works Offline
- Current screen remains visible
- Actions you take are **queued** in localStorage (`rider_offline_queue`)

### Queued Actions
These actions are stored and replayed when you reconnect:
- **Accept Order**
- **Update Status**
- **Reached Outlet**

### Visual Indicators
| State | Indicator |
|---|---|
| Offline | "Offline — Actions queued" banner |
| Syncing | "Syncing N action(s)..." banner |
| Online | Sync status pill shows "Synced" with green pulse |

### Auto-Sync
- When internet returns, queued actions execute sequentially
- Failed actions remain in the queue for retry
- No data loss during brief disconnections

---

## 17. Pull-to-Refresh & App Reset

### Pull-to-Refresh (Mobile)
1. At the top of any scrollable view, pull down
2. A **pull indicator** appears with rotation animation
3. Pull past **200px** threshold
4. Triggers `completeSiteRefresh()` — a deep app refresh

### Reset App (Sidebar)
1. Open the **sidebar**
2. Tap **"Reset App"**
3. Read the confirmation dialog
4. Confirm

What Reset does:
- Unregisters all **Service Workers**
- Clears all **caches** (Cache API)
- Clears active order from **localStorage**
- Reloads the page with **cache-busting query parameters**

When to use Reset:
- App feels sluggish or stuck
- Orders not appearing
- After an app update notification

---

## 18. Install as PWA (Progressive Web App)

### Benefits of Installing
- Works like a native app
- Icon on your home screen
- Dedicated window (no browser tabs)
- Faster loading

### How to Install
1. Open the **sidebar**
2. Tap **"Install App"** (only visible if install is available)
3. Follow your browser's installation prompt
4. The app opens in standalone mode

### Manual Install (Chrome Android)
1. Open the app in Chrome
2. Tap the **three-dot menu** (⋮)
3. Tap **"Add to Home screen"**
4. Tap **"Install"**

### Manual Install (Safari iOS)
1. Open the app in Safari
2. Tap the **Share button** (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**

---

## 19. Troubleshooting

### Cannot Log In
- Check your internet connection
- Ensure you're using the correct email/phone and password
- Contact your admin to reset your password
- Check if your account is active in the SuperAdmin panel

### No Orders Appearing
1. Verify you are **Online** (green dot in header)
2. Check you are within **1km of an outlet**
3. Ensure the outlet has active orders in `ready`/`cooked`/`confirmed` status
4. Pull-to-refresh or use **Reset App** from the sidebar
5. Check your notification permissions

### Map Not Loading
- Ensure **GPS location** is enabled on your device
- Grant location permission when prompted
- Toggle offline/online to restart location tracking
- Check internet connection

### OTP Not Working
- Ask the customer to read the OTP from their WhatsApp message
- Tap **"Regenerate & Send OTP"** to send a new code
- After 10 failed attempts, wait **60 seconds** before trying again
- If you are an admin rider, use **"Emergency Override"**

### Payment Issues
- Ensure you select **Cash** or **UPI** before the delivery finalizes
- If the payment panel doesn't appear, check your internet
- Contact admin for settlement of cash collected

### App Freezing/Stuck
1. Try **Pull-to-Refresh** (mobile) or **Reset App** (sidebar)
2. Close and reopen the browser tab
3. Clear browser cache
4. Reinstall the PWA

### Location Not Updating
- Check device GPS is enabled
- Toggle offline → online
- Restart the app
- Check if battery saver is restricting GPS

---

## Quick Reference

| Action | How |
|---|---|
| Accept an order | Ping modal (auto) or PICKUP tab (manual) |
| View active delivery | LIVE tab (map) or HOME tab (card) |
| Progress delivery | Slide the action bar at each step |
| Verify items | Auto-opens after reaching outlet |
| Enter OTP | Auto-opens after reaching customer |
| Collect payment | Select Cash/UPI after OTP |
| View earnings | WALLET tab or Earnings Dashboard |
| View history | Sidebar → Trip History |
| Go online/offline | Header toggle |
| Change photo | Profile → Camera button |
| Reset app | Sidebar → Reset App |
| Install app | Sidebar → Install App |
| View notifications | Bell icon in header |
| Clear notifications | Notification sheet → Clear All |
| Settle cash | Contact admin |
