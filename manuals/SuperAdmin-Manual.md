# Foodhubbie SuperAdmin — Enterprise Control Center Manual

## Table of Contents
1. [Overview & Access](#1-overview--access)
2. [Authentication & 2FA](#2-authentication--2fa)
3. [Dashboard & Navigation](#3-dashboard--navigation)
4. [Role-Based Access Control](#4-role-based-access-control)
5. [Partner Onboarding](#5-partner-onboarding)
6. [Business Management](#6-business-management)
7. [Rider Management](#7-rider-management)
8. [Order Management](#8-order-management)
9. [Promotions Center](#9-promotions-center)
10. [User Registry](#10-user-registry)
11. [Financial Reconciliation](#11-financial-reconciliation)
12. [Delivery Configuration](#12-delivery-configuration)
13. [Inventory Control](#13-inventory-control)
14. [Broadcast Center](#14-broadcast-center)
15. [Reviews & Ratings](#15-reviews--ratings)
16. [Security Audit](#16-security-audit)
17. [Reports & Analytics](#17-reports--analytics)
18. [Infrastructure Settings](#18-infrastructure-settings)
19. [Data Retention](#19-data-retention)

---

## 1. Overview & Access

### What is SuperAdmin?
SuperAdmin is the enterprise control center for managing the entire Foodhubbie ecosystem. It provides a unified dashboard for all businesses, outlets, riders, users, orders, promotions, and system configuration.

### Accessing SuperAdmin
- Open the SuperAdmin URL in your browser
- You must have a **Super Admin account** registered in Firebase under `system/admins/{uid}`
- Standard ShopAdmin accounts cannot access this portal

### System Requirements
- Modern browser (Chrome, Firefox, Edge, Safari)
- Internet connection
- Authenticator app (Google Authenticator, Authy) for 2FA

---

## 2. Authentication & 2FA

### Login Process
1. Open the SuperAdmin URL
2. You'll see the **Login Overlay** — enter your Email and Password
3. Click **"Sign In"**
4. If 2FA is enabled, the **2FA Verification Modal** appears

### Two-Factor Authentication (2FA)

#### Setting Up 2FA
1. After logging in, go to **Settings → TFA Setup**
2. Click **"Setup 2FA"**
3. A **QR code** is displayed — scan it with your authenticator app
4. Enter the **6-digit code** from your authenticator app
5. Click **"Verify & Enable"**
6. 2FA is now active for your account

#### Logging in with 2FA
1. Enter your email and password as usual
2. After successful login, the **2FA Verification Modal** appears
3. Open your authenticator app and read the current 6-digit code
4. Enter the code and click **"Verify Code"**
5. Upon success, you enter the main dashboard

#### Disabling 2FA
1. Go to **Settings → TFA Status**
2. Click **"Disable 2FA"**
3. Confirm the action
4. 2FA is removed from your account

### Session Management
- Sessions persist via Firebase Auth tokens
- Reloading the page restores your session automatically
- Click **Logout** in the header to end your session

---

## 3. Dashboard & Navigation

### Sidebar Navigation
The sidebar has 18 tabs organized in 3 groups:

**Ecosystem Overview:**
| Tab | Purpose |
|---|---|
| Ecosystem Overview | KPI cards, real-time stats |
| Partner Requests | Onboarding queue |
| Financial Recon | Settlement management |
| Managed Entities | Business/outlet list |
| Global Analytics | Platform economics |
| Rider Management | Fleet overview |
| Service Slabs | Delivery fee config |
| Inventory Control | Cross-outlet stock |
| Promotions Center | Coupons, surge, discounts |
| User Registry | All platform users |

**Growth & Engagement:**
| Tab | Purpose |
|---|---|
| Live Orders | Real-time order pipeline |
| Ratings & Reviews | Customer feedback |
| Broadcast Center | Push notifications |

**System Core:**
| Tab | Purpose |
|---|---|
| Security Audit | Activity log |
| Ecosystem Reports | Platform economics |
| Infrastructure | System settings |

### Ecosystem Overview Dashboard
The main dashboard shows:
- **Total Businesses** — Number of active businesses
- **Active Outlets** — Number of active outlets
- **Total Riders** — Registered rider count
- **Total Users** — Registered user count
- **Today's Orders** — Orders placed today
- **Today's Revenue** — Gross Transaction Value today
- **Pending Onboarding** — New partner requests awaiting action

---

## 4. Role-Based Access Control (RBAC)

### Role Definitions

| Role | Access Level | Visible Tabs |
|---|---|---|
| **Superadmin** | Full access | All 18 tabs |
| **Business** | Business management | 10 tabs (dashboard, liveorders, riders, users, businesses, promotions, inventory, delivery, reviews, reports) |
| **Outlet** | Limited view | 3 tabs (dashboard, liveorders, reviews) |
| **Support** | Customer support | 4 tabs (dashboard, users, reviews, broadcast) |

### How RBAC Works
- Each role has a predefined set of **permitted tabs**
- Each role has a set of **permitted operations** (e.g., `manage_businesses`, `manage_riders`)
- When a user logs in, their role is determined from `system/admins/{uid}`
- After 2FA verification, RBAC restrictions are applied:
  - Unauthorized tabs are hidden from the sidebar
  - Sensitive controls are hidden for non-superadmin roles
  - A **role badge** appears in the profile area

### Available Operations
| Operation | Allowed Roles | Description |
|---|---|---|
| `manage_businesses` | superadmin, business | Edit outlets, manage commissions |
| `manage_riders` | superadmin, business | Create/edit/delete riders |
| `manage_promotions` | superadmin, business | Manage coupons, surge, discounts |
| `view_orders` | superadmin, business, outlet | View order pipeline |
| `view_users` | superadmin, business, support | View user registry |
| `view_reviews` | superadmin, business, outlet, support | View customer reviews |
| `send_broadcast` | superadmin, support | Send push notifications |
| `all` | superadmin | All operations |

---

## 5. Partner Onboarding

### 5.1 Manual Provisioning (Onboarding Form)

Use the onboarding form to create a new business from scratch:

1. Click **"Provision Node"** in the header, or navigate to Partner Requests tab
2. Fill in the form:
   - **Legal Business Name**
   - **Global System Identifier** (unique slug for internal use)
   - **Primary Node Name** (display name)
   - **Unique ID** (internal reference)
   - **Marketplace Routing Slug** (URL slug for customers)
   - **Full Address** (street, city, etc.)
   - **Latitude / Longitude** (GPS coordinates)
   - **Admin Email** (login email for the new admin)
   - **Admin Mobile** (phone number)
   - **Admin Password** (temporary password)
3. Click **Submit**
4. The system:
   - Creates a Firebase Auth account for the admin
   - Creates business node with default 15% + ₹5 commission
   - Creates outlet with store settings
   - Creates admin profile record
   - Creates marketplace URL slug mapping
   - Logs all actions to audit trail

### 5.2 Partner Request Queue

1. Navigate to **Partner Requests** tab
2. View all pending onboarding applications
3. Each request shows:
   - Business name and owner
   - Contact email and phone
   - KYC documents (FSSAI, GST, Aadhar, PAN) — click to view
   - Submitted date
   - **Approve** and **Reject** buttons

#### Approving a Request
1. Click **"Approve"** on a pending request
2. Read the confirmation dialog carefully
3. Click **"Initialize Node"** to proceed
4. The system automatically:
   - Generates a `businessId` and `outletId`
   - Creates business node in Firebase
   - Creates outlet node with default config (10% commission)
   - Creates starter menu categories (from the request)
   - Creates admin Firebase Auth account
   - Creates admin profile under `system/admins/{adminUid}` with role "Partner Admin"
   - Archives the request to onboarding history
5. A dialog shows the generated **admin email** and **temporary password**
6. **Important:** Share the temporary password securely with the new partner

#### Rejecting a Request
1. Click **"Reject"** on a pending request
2. Confirm the rejection
3. The request is permanently removed from the database

### 5.3 Rate Limiting
- Ecosystem initialization is limited to **3 creations per 5 minutes** per admin
- This prevents accidental duplicate provisioning

---

## 6. Business Management

### 6.1 Viewing Businesses
1. Navigate to **Managed Entities** tab
2. Table shows all businesses with: Name, Outlets, Status, Commission, Created Date
3. Use pagination to browse (15 per page)

### 6.2 Editing an Outlet
1. Click the **Edit icon** on any business row
2. The **Outlet Edit Modal** opens:
   - **Outlet Name**
   - **Outlet Slug** (URL identifier)
   - **Full Address**
   - **Latitude / Longitude**
   - **Admin Phone**
   - **New Password** (optional — leave blank to keep current)
3. Click **"Update Outlet"** to save
4. Changes are written atomically with audit logging

### 6.3 Managing Commission
1. Click the **Commission icon** on any business row
2. The **Commission Modal** opens:
   - **Commission Percentage** (e.g., 15)
   - **Fixed Fee** (e.g., ₹5 per order)
3. Click **"Save Commission"** to update
4. These values affect settlement calculations for all orders from this business

### 6.4 Business Search
- Use the search bar to find businesses by name or ID

---

## 7. Rider Management

### 7.1 Viewing Riders
1. Navigate to **Rider Management** tab
2. Table shows: Name, Email, Phone, Status, Created Date
3. Use pagination (20 per page)
4. Search by name or email

### 7.2 Creating a Rider
1. Click **"Add Rider"**
2. Fill in:
   - **Name** (required)
   - **Email** (required — used as login)
   - **Password** (min 6 characters)
   - **Phone**
   - **Father's Name**
   - **Age**
   - **Aadhar Number**
   - **Qualification**
   - **Address**
   - **Profile Photo** (upload)
   - **Aadhar Card Photo** (upload)
3. Click **"Save"**
4. The system creates a Firebase Auth account and rider profile

### 7.3 Editing a Rider
1. Click the **Edit icon**
2. Modify fields
3. Click **"Save"**

### 7.4 Resetting Rider Password
1. Click the **Key icon**
2. Confirm the action
3. A password reset email is sent to the rider

### 7.5 Deleting a Rider
1. Click the **Delete icon**
2. Read the confirmation — this is irreversible
3. Confirm to permanently remove the rider record

### 7.6 KYC Document Upload
When creating/editing a rider, you can upload:
- **Profile Photo** — compressed and stored in Firebase Storage
- **Aadhar Card Photo** — stored in Firebase Storage with KYC status tracking

---

## 8. Order Management

### 8.1 Live Orders Pipeline
1. Navigate to **Live Orders** tab
2. Two view modes:

#### Table View
- All orders across all businesses/outlets
- Columns: Order ID, Outlet, Customer, Items, Total, Status, Time
- Filter by status using the pipeline buttons

#### Kanban View
- Drag-and-drop board with columns:
  - **Pending** → Confirmed
  - **Preparing** → Cooked
  - **On The Way** → Out for Delivery
  - **Completed** → Delivered
- Drag an order card to a new column to update its status
- Status writes are atomic with audit logging

### 8.2 Manual Status Update
1. Click the **Status button** on any order
2. Enter the new status in the prompt
3. Valid statuses: Placed, Confirmed, Preparing, Cooked, Ready, Out for Delivery, Reached Drop Location, Delivered, Cancelled
4. The order is updated atomically

### 8.3 Real-Time Updates
- Orders load in real-time via Firebase listeners
- New orders appear automatically without page refresh

---

## 9. Promotions Center

### 9.1 Surge Pricing Engine
1. Navigate to **Promotions Center** tab
2. Find the **Surge Engine** card
3. Set:
   - **Multiplier** (1.0 = normal, 1.5 = 50% surge, 2.0 = 100% surge)
   - **Reason** (e.g., "Peak hours — Dinner rush")
4. Click **"Apply Surge"**
5. Surge is active when multiplier > 1.0
6. The marketplace shows surge indicators during checkout

### 9.2 Global Discount Engine
1. Find the **Eco Discount** card
2. Set:
   - **Value** (discount amount)
   - **Type** (Percentage or Fixed)
3. Click **"Apply Discount"**
4. Discount is active when value > 0
5. Applied automatically to all marketplace orders

### 9.3 Platform Fee
1. Find the **Platform Fee** card
2. Set the fee amount in rupees
3. Click **"Update"**
4. The fee is charged on every marketplace order

### 9.4 Coupon Management

#### Creating a Coupon
1. Click **"Add Coupon"**
2. Fill in:
   - **Promo Code** (e.g., "SAVE50" — auto-uppercased)
   - **Type** (Percentage or Fixed Rupee)
   - **Value** (e.g., 50 for ₹50 off or 50% off)
   - **Minimum Order** (₹ required to use this coupon)
   - **Usage Limit** (max number of redemptions)
   - **Active** toggle
3. Click **"Deploy Coupon"**
4. Rate-limited: max 10 coupons per minute

#### Toggling a Coupon
- Click the **Toggle button** on any coupon to activate/deactivate

#### Deleting a Coupon
1. Click the **Delete icon** on any coupon
2. Confirm the action
3. The coupon is permanently removed

#### Bulk Operations
- **"Pause All"** — deactivates all coupons at once

#### Exporting Coupons
- Click **Export** to download the full coupon registry as CSV

---

## 10. User Registry

### 10.1 Viewing Users
1. Navigate to **User Registry** tab
2. Table shows: Name, Email, Phone, Wallet Balance, Last Active
3. Search by name or email
4. Pagination (20 per page)

### 10.2 Crediting Wallet
1. Click the **Plus icon** on any user row
2. The **Wallet Credit Modal** opens:
   - Shows user name and email
   - Enter **Amount** (must be > 0)
   - Enter **Reason** (required, e.g., "Refund for order #1234")
3. Click **"Credit Wallet"**
4. The amount is atomically added to the user's wallet balance
5. A transaction record is created in the user's wallet history

### 10.3 Password Reset
1. Click the **Key icon** on any user row
2. Confirm the action
3. A Firebase Auth password reset email is sent to the user

### 10.4 Viewing Wallet History
- Click the **History icon** on any user row
- A dialog shows the last 5 wallet transactions

### 10.5 Exporting Users
- Click **Export** to download the full user registry as CSV

---

## 11. Financial Reconciliation

### 11.1 Overview
1. Navigate to **Financial Recon** tab
2. Filter by:
   - **Date Range** (from/to)
   - **Outlet** (specific outlet or all)
   - **Status** (All, Pending, Settled)

### 11.2 Global KPIs
| KPI | Description |
|---|---|
| **Total Volume** | Gross Transaction Value (GTV) |
| **Platform Commissions** | Total commission earned |
| **Pending Settlements** | Unsettled amount |
| **Total Settled** | Completed settlements |

### 11.3 Transaction Ledger
Each row shows:
- **Ref ID** and **Date**
- **Partner Node** (business/outlet name)
- **Order Total**
- **Commission** (platform fee)
- **Rider Payout**
- **Net Payout** (shop earnings)
- **Status** (PENDING / SETTLED)
- **Action** button

### 11.4 Settling a Transaction
1. Click **"Settle"** on a pending transaction
2. A SweetAlert2 confirmation dialog appears
3. Click **"Yes, Execute Settlement"**
4. The system:
   - Fetches current wallet balance
   - Creates a ledger entry with transaction ID
   - Updates settlement status to "SETTLED"
   - Records settled by admin and timestamp
   - Updates outlet wallet balance
   - Logs the action to audit trail

### 11.5 Exporting Reports
- Click **Export** to download the reconciliation report as CSV

---

## 12. Delivery Configuration

### 12.1 Global Delivery Fee Slabs
1. Navigate to **Service Slabs** tab
2. View the current delivery fee slab table

| Distance (km) | Fee (₹) |
|---|---|
| 2 | 20 |
| 5 | 40 |
| 10 | 60 |

3. **Add a slab**: Click "Add Slab" → Enter km + fee
4. **Edit a slab**: Change values directly in the input fields
5. **Remove a slab**: Click the Trash icon
6. **Save**: Click "Save Global Delivery Flow"
7. These slabs apply to all outlets that don't have custom delivery settings

### 12.2 How Delivery Fee Works
- Distance is calculated using Haversine formula
- The first slab where distance ≤ upToKm determines the fee
- If distance exceeds all slabs, the highest slab fee is charged

---

## 13. Inventory Control

### 13.1 Cross-Outlet Inventory View
1. Navigate to **Inventory Control** tab
2. The system scans all businesses/outlets for dish inventory
3. Table shows: Dish Name, Outlet, Business, Current Stock, Status
4. Search by dish name

### 13.2 Quick Stock Adjustment
1. Click **+** or **-** on any inventory row
2. Stock adjusts by 1 unit
3. If stock reaches 0, the dish is auto-marked as unavailable

### 13.3 Toggle Availability
1. Click the **Toggle button** on any inventory row
2. Force a dish to be Available or Out of Stock
3. This overrides the automatic stock-based availability

---

## 14. Broadcast Center

### 14.1 Sending a Broadcast
1. Navigate to **Broadcast Center** tab
2. Fill in:
   - **Title** (required)
   - **Message Body** (required)
   - **Target Audience** (All Users / Restaurant Partners / Riders)
   - **Category** (Promotional / System Update / Announcement)
   - **Image URL** (optional)
3. Click **"Send Broadcast"**
4. Rate-limited: max 5 broadcasts per minute

### 14.2 Broadcast History
- View all past broadcasts with:
  - Title, audience, category
  - Sent timestamp
  - Sender (admin email)
  - Status

---

## 15. Reviews & Ratings

### 15.1 Viewing Reviews
1. Navigate to **Ratings & Reviews** tab
2. Displays all customer reviews across all outlets
3. Each review shows:
   - Outlet name
   - Customer name
   - Star rating (1-5)
   - Review text
   - Rider rating (if applicable)
   - Date

### 15.2 Auto-Loading
- Reviews load automatically when you switch to the tab
- Sorted by date (newest first)

---

## 16. Security Audit

### 16.1 Viewing Audit Logs
1. Navigate to **Security Audit** tab
2. Table shows all admin actions with:
   - **Timestamp**
   - **Admin Email**
   - **Action** (e.g., SESSION_INIT, UPDATE_OUTLET, CREATE_COUPON)
   - **Details** (JSON with action-specific parameters)
3. Pagination (50 per page)

### 16.2 Audit Sources
The audit log aggregates from 4 sources:
1. **System Audit Logs** (`system/auditLogs`) — SuperAdmin actions
2. **Marketplace Audit** (`logs/marketplaceAudit`) — Marketplace events
3. **Bot Audit** (`logs/botAudit`) — WhatsApp bot events
4. **Rider Errors** (`logs/riderErrors`) — Rider app errors

---

## 17. Reports & Analytics

### 17.1 Global Ecosystem Reports
1. Navigate to **Ecosystem Reports** tab
2. Reports show:

**Platform KPIs:**
- Total Revenue (GTV)
- Total Orders
- Average Order Value
- Loyalty Rewards Disbursed
- Net Platform Revenue (commissions + fees)
- Total Partner Payouts
- Platform Take Rate (%)

**Leaderboards:**
- Top 10 Businesses by Revenue
- Top 10 Outlets by Orders

**Charts:**
- Daily Revenue Trend (last 7 days)

### 17.2 Exporting Reports
- **CSV Export**: Download data as CSV
- **PDF Export**: Download formatted report as PDF (uses html2pdf.js)

---

## 18. Infrastructure Settings

### 18.1 TFA Status
- View current 2FA status (Enabled / Disabled)
- **Setup 2FA**: Enable two-factor authentication
- **Disable 2FA**: Turn off two-factor authentication

### 18.2 Data Retention
Configure automatic data cleanup:
- **Orders** — Archive or delete orders older than N days
- **Audit Logs** — Archive or delete audit logs older than N days
- **Settlements** — Archive or delete settlement records older than N days

#### Running Data Retention
1. Set the number of **days** for each data type
2. Choose **Action**: Archive (copy to archives/ path) or Purge (delete permanently)
3. Click **"Apply"** for the specific data type
4. The system scans and processes records in batches
5. Status updates during processing

---

## 19. Data Retention

### Retention Policies
| Data Type | Default Retention | Actions |
|---|---|---|
| Orders | Configurable | Archive or Purge |
| Audit Logs | Configurable | Archive or Purge |
| Settlements | Configurable | Archive or Purge |

### Archive vs Purge
- **Archive**: Copies records to `archives/{type}/` before removing from the active path
- **Purge**: Permanently deletes records (irreversible)

### Running a Retention Job
1. Go to **Settings → Data Retention**
2. Set the retention period in days for each data type
3. Select **Archive** or **Purge**
4. Click **Apply**
5. Monitor progress via the status text

---

## Quick Reference

| Action | Tab | How |
|---|---|---|
| View dashboard | Ecosystem Overview | First tab after login |
| Provision new business | Partner Requests | Click "Provision Node" |
| Approve partner | Partner Requests | Click "Approve" |
| Edit outlet | Managed Entities | Click Edit icon |
| Change commission | Managed Entities | Click Commission icon |
| Manage riders | Rider Management | Add/Edit/Delete |
| View orders | Live Orders | Table or Kanban view |
| Manage coupons | Promotions Center | Add/Toggle/Delete |
| Set surge pricing | Promotions Center | Surge Engine card |
| Credit user wallet | User Registry | Click Plus icon |
| Settle transactions | Financial Recon | Click "Settle" |
| Configure delivery fees | Service Slabs | Add/Edit/Remove slabs |
| Send broadcast | Broadcast Center | Fill form → Send |
| View audit logs | Security Audit | Browse paginated logs |
| Export reports | Ecosystem Reports | CSV or PDF |
| Enable 2FA | Infrastructure | TFA Setup section |
| Data retention | Infrastructure | Apply per data type |
| Logout | Header | Click logout icon |
