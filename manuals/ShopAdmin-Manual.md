# Foodhubbie ShopAdmin — Complete Operations Manual

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Order Management](#3-order-management)
4. [POS (Walk-in Sales)](#4-pos-walk-in-sales)
5. [Catalog Management](#5-catalog-management)
6. [Rider Fleet Management](#6-rider-fleet-management)
7. [Customers & Reports](#7-customers--reports)
8. [Settlements](#8-settlements)
9. [Inventory Management](#9-inventory-management)
10. [Settings](#10-settings)
11. [Notifications](#11-notifications)
12. [Partner Approvals](#12-partner-approvals)
13. [Printing](#13-printing)

---

## 1. Getting Started

### Login
1. Open the ShopAdmin URL in your browser
2. Enter your **Email** and **Password** on the login form
3. Click **"Sign In to Dashboard"**
4. You will be redirected to the main dashboard

### Session & Security
- Session auto-logouts after **30 minutes of inactivity**
- Moving your mouse or pressing keys resets the idle timer
- Click "Sign Out" in the sidebar to end your session manually
- Reauthentication (entering your password again) is required before destructive actions (delete category, delete rider)

### Navigation
- **Desktop sidebar** shows all sections grouped by category
- **Mobile bottom bar** has 5 quick-access buttons: Dash, Orders, Live, POS, More
- Click any menu item to switch tabs
- The browser's back button navigates through your tab history

---

## 2. Dashboard

The Dashboard is your command center showing real-time business performance.

### What you see
| Element | Description |
|---|---|
| **KPI Cards** | Today's Orders, Pending Count, Today's Revenue, Active Riders |
| **Revenue Chart** | 7-day daily revenue line chart |
| **Priority Orders** | Top 8 priority orders (Placed/Confirmed/Preparing/Cooked/Ready/Pending), sorted by urgency |
| **Top Items** | 5 best-selling items today |
| **Top Customers** | 5 highest-LTV customers |
| **Rider Status Cards** | Online/Busy/Offline rider count with names |

### Auto-refresh
- Dashboard updates in real-time as new orders arrive
- No manual refresh needed

---

## 3. Order Management

### 3.1 Order Lifecycle

Orders flow through a fixed sequence of statuses:

**Online Orders:** Placed → Confirmed → Preparing → Cooked → Ready → Out for Delivery → Reached Drop Location → Delivered

**Dine-in Orders:** Confirmed → Preparing → Cooked → Ready → Delivered

### 3.2 Receiving New Orders
1. When a new order arrives:
   - A **banner slides in** with a looping sound (every 3 seconds)
   - An **OS notification** fires (if permitted)
   - The **Live badge** increments
2. Click **"Dismiss"** on the banner or click the order row to stop the alert loop

### 3.3 Viewing Orders

Three tabs show orders:

| Tab | What it shows |
|---|---|
| **Order History** | All orders with search, date filters, and pagination |
| **Live Ops** | Recent orders plus a map with rider locations |
| **Kitchen Console** | Orders grouped by status for kitchen staff |

### 3.4 Order Actions

Click any order row to open the **Order Drawer** with full details.

**Update Status:**
1. Find the order in any orders table
2. Use the **Status dropdown** (select beside each order)
3. The system validates the sequence — you can only advance to the next logical step (or cancel)
4. On **"Delivered"**: A payment picker appears — select Cash or UPI
5. On **"Confirmed"**: Inventory is auto-deducted for each item

**Assign a Rider:**
1. Use the **Rider dropdown** beside the order
2. Select a rider from the list
3. If the order was "Placed", it auto-transitions to "Confirmed"
4. Rider receives a WhatsApp notification

**Rules:**
- Orders can be cancelled from any status **except** Delivered
- Cancelled orders can be **resurrected** back to "Placed"
- A rider must be assigned **before** marking "Out for Delivery"
- Delivery fee is recalculated on resurrection

### 3.5 Searching & Filtering
- Use the **Search bar** to find orders by ID or customer name
- Use **Date From/To** filters to narrow by date range
- Click **"Load More"** to fetch more orders (50 at a time)

### 3.6 Payment
- Mark an order as **Paid** using the "Mark Paid" button
- On delivery, you can re-print the receipt

---

## 4. POS (Walk-in Sales)

The Point-of-Sale system is for dine-in/takeaway customers who order in person.

### 4.1 Starting a Sale
1. Switch to the **POS Control** tab
2. Browse the menu grid or use the **Search** bar
3. Items are filtered by **Category tabs** at the top

### 4.2 Adding Items to Cart
1. Click a dish card → The **Item Configuration Panel** opens
2. Options:
   - **Select Size** (if multiple sizes exist)
   - **Toggle Add-ons** (toppings/extras)
   - **Adjust Quantity** using +/- buttons
   - The total updates in real-time
3. Click **"Add to Cart"** → Item appears in the cart panel

### 4.3 Managing the Cart
| Action | How |
|---|---|
| Increase quantity | Click **+** on cart item |
| Decrease quantity | Click **-** on cart item |
| Remove item | Click **trash icon** on cart item |
| Clear entire cart | Click **"Clear Cart"** |

### 4.4 Customer Lookup
1. Enter the customer's **phone number** in the Phone field
2. If the customer exists in your database, their name auto-fills
3. Optionally add **Customer Name**, **Table Number**, and **Order Notes**

### 4.5 Applying Discounts
- **Fixed discount**: Enter amount in the discount input
- **Percentage discount**: Click preset chips (e.g., 10%) or enter a value
- The discount is reflected in the total immediately

### 4.6 Completing the Sale
1. Verify all items and prices in the cart
2. Select **Payment Method**: Cash or UPI
3. Click **"Record Sale"**
4. The system:
   - Validates prices against live dish data
   - Generates a unique order ID
   - Saves the order as "Dine-in" type
   - Auto-deducts stock
   - Updates customer lifetime value
   - Prints the receipt automatically

### 4.7 Reprinting Last Receipt
- Click **"Print Last"** to reprint the most recent POS receipt

---

## 5. Catalog Management

### 5.1 Categories

**Add a Category:**
1. Go to **Categories** tab
2. Enter **Category Name** and **Sort Order**
3. Optionally upload a **Category Image**
4. Optionally add **Category-level Add-ons** (e.g., "Extra Cheese" available for all dishes in this category)
5. Click **"Deploy"**

**Edit a Category:**
1. Click the **Edit icon** on any category
2. Modify fields
3. Click **"Update Category"**

**Delete a Category:**
1. Click the **Delete icon** on any category
2. Enter your password for security verification
3. Confirm deletion
4. **Warning:** This deletes the category AND all dishes inside it

### 5.2 Dishes (Menu Items)

**Add a Dish:**
1. Go to **Menu Items** tab
2. Click **"+ Add Dish"**
3. In the Dish Modal:
   - **Step 1**: Select a **Category**
   - **Name**: Enter dish name
   - **Serial**: Enter sort order (lower = appears first)
   - **Base Price** in rupees
   - **Sizes & Variations**: Add size options (Small ₹100, Medium ₹200, Large ₹300)
   - **Add-ons**: Add optional extras (Extra Cheese ₹40, Mayo ₹20)
   - **Image**: Upload a photo (auto-compressed to <200KB)
4. Click **"Save Dish Information"**

**Edit a Dish:**
1. Click the **Edit icon** on any dish card
2. Modify fields in the modal
3. Click **"Save Dish Information"**

**Delete a Dish:**
1. Click the **Delete icon**
2. Enter your password for security
3. Confirm deletion

**Toggle Availability:**
- Toggle the **checkbox** on any dish card to mark it Available/Out of Stock

### 5.3 Bulk Operations

**Migrate Add-ons to Categories:**
- Copies all dish-level add-ons to their parent category for consistency
- Requires password reauthentication

**Run Image Migration:**
- Converts all Firebase Storage image URLs to Base64 data URIs in the database
- Use this if you're migrating away from Firebase Storage

### 5.4 Searching
- Use **Search** bar to filter dishes by name
- Use **Search** bar to filter categories by name

---

## 6. Rider Fleet Management

### 6.1 Viewing Riders
- Go to the **Rider Fleet** tab
- Table shows: Name, Phone, Email, Status, Last Seen, Delivery Stats
- Dashboard shows summary: Online/Busy/Offline counts

### 6.2 Adding a Rider
1. Click **"Add Rider"**
2. Fill in:
   - **Full Name** (required)
   - **Email** (required — used as login ID)
   - **Password** (auto-generated, shown once — copy it!)
   - **Phone** (10 digits required)
   - **Father's Name**
   - **Age**
   - **Aadhar Number** (12 digits required)
   - **Qualification**
   - **Address**
   - **Profile Photo** (optional)
   - **Aadhar Photo** (optional)
3. Click **"Create Account"**
4. The system creates a Firebase Auth account and writes rider data

### 6.3 Editing a Rider
1. Click **Edit icon** on a rider row
2. Modify fields
3. Click **"Update Rider"**

### 6.4 Deleting a Rider
1. Click **Delete icon**
2. Enter your password for security
3. Confirm deletion
4. The rider record is permanently removed

### 6.5 Password Reset
1. Click the **Key icon** on a rider row
2. A password reset email is sent to the rider's email address

### 6.6 Wallet Settlement
1. Click the **Wallet icon** on a rider row
2. The system calculates pending cash from undelivered cash orders in the last 48 hours
3. Review the amount
4. Confirm to mark those orders as settled
5. A settlement record and WhatsApp notification are created

### 6.7 Viewing Ledger
1. Click the **File Text icon** on a rider row
2. A modal shows the last 50 transactions (earnings and settlements)

---

## 7. Customers & Reports

### 7.1 Customer Database
- Go to **Customers** tab
- Table shows: Name, Phone, Address, Order Count, Lifetime Value (LTV)
- Use **Search** to filter customers by name or phone
- Data refreshes automatically

### 7.2 Sales Reports
1. Go to **Analytics** tab
2. Select **From** and **To** dates
3. Click **"Generate Report"**
4. The report shows:
   - **KPIs**: Total Revenue, Total Orders, Average Ticket, Repeat Rate
   - **Detailed Table**: Per-order breakdown (date, items, amount)
   - **Revenue Chart**: Daily revenue line graph
5. Data loads in chunks of 20 rows for performance

### 7.3 Exporting Reports
- **Excel**: Click "Download Excel" → Downloads `.xlsx` file
- **PDF**: Click "Download PDF" → Downloads PDF with table
- **WhatsApp Bot Report**: Click "Bot Report" → Bot sends report via WhatsApp

### 7.4 Lost Sales (Abandoned Carts)
1. Go to **Lost Sales** tab (accessible from Reports section)
2. View abandoned carts with customer info, items, and value
3. Click **"Clear All"** to remove all lost sales records

---

## 8. Settlements

### 8.1 Viewing Settlements
1. Go to **Settlements** tab
2. Use **Date From/To** filters
3. Table shows per-order: Order Total, Platform Commission, Rider Payout, Shop Net, Status
4. **KPI Cards** show: Total Revenue, Total Commission, Total Rider Payout, Total Settled

### 8.2 Auto-Settlement on Delivery
When an order is marked "Delivered":
- Platform commission is calculated (percentage or fixed)
- Rider payout = delivery fee
- Shop net = total - commission - rider fee
- A settlement record and ledger entry are created
- Wallet balance increments atomically

### 8.3 Export
- Click **Export** to download settlement data as CSV

---

## 9. Inventory Management

### 9.1 Viewing Inventory
- Go to **Inventory** tab
- Table shows: Product Name, Current Stock, Low Stock Threshold
- KPI cards: Total Items, Low Stock Items

### 9.2 Adding Inventory Items
1. Click **"Add Item"**
2. Enter **Product Name**, **Opening Stock**, **Low Stock Alert Threshold**
3. Click **"Start Tracking"**

### 9.3 Adjusting Stock
- Click **+** or **-** buttons to adjust stock up or down
- Stock auto-deducts when orders are confirmed
- Low-stock toast notification appears when stock <= threshold

### 9.4 Editing/Deleting
- Click **Edit icon** to modify item name, stock, or threshold
- Click **Delete icon** to remove item (with confirmation)

---

## 10. Settings

### 10.1 Store Information
| Field | Description |
|---|---|
| Entity Name | Business legal name (auto-uppercased) |
| Store Name | Display name (auto-uppercased) |
| Address | Store physical address |
| GSTIN | Auto-formatted, 15 chars |
| FSSAI | Numeric only, 14 digits |
| Tagline | Auto-uppercased |
| Powered By | Footer credit text |
| Open/Close Time | Operating hours |

### 10.2 Revenue & Commission
| Field | Description |
|---|---|
| Commission Type | Fixed (₹) or Percentage (%) |
| Commission Value | Amount per order |
| Rider Fee Base | Base delivery fee |
| Rider KM Incentive | Per-km incentive for riders |

### 10.3 Delivery Settings
- Configure **Fee Slabs**: Distance (km) → Fee (₹) pairs
- Example: 0-2km = ₹20, 2-5km = ₹40, 5-10km = ₹60

### 10.4 WhatsApp Bot Settings
| Section | Description |
|---|---|
| Greeting Image | Image sent when customer first messages |
| Menu Image | Menu shared with customers |
| Status Images | Custom images for each order status (Confirmed, Preparing, Cooked, Out for Delivery, Delivered, Feedback) |
| Social Links | Instagram, Facebook, Review URL, Website |

### 10.5 Display Controls
Toggle visibility of: Store Name, Address, GSTIN, FSSAI, Tagline, Powered By, Payment QR, WiFi Info, Social Links, Feedback QR

### 10.6 Payment QR
Upload a UPI QR code image that appears on receipts and bot messages.

### 10.7 Receipt Preview
As you modify settings, a **live thermal receipt preview** updates in real-time showing how the receipt will look.

### 10.8 Saving Settings
1. Make your changes across any settings sections
2. Click **"Save Settings"** at the bottom
3. Validation checks: coordinates, GSTIN format, FSSAI format, phone numbers
4. All 5 settings paths are saved atomically
5. If store name changed, all dish records are synced

### 10.9 Quick Toggle
- Use **Shop Open/Closed** toggle to instantly open or close your store
- Changes take effect immediately for the Marketplace and bot

---

## 11. Notifications

### 11.1 In-App Alerts
- New orders trigger a **sound + banner** alert
- Order status changes show **toast notifications**
- Error messages show **red toasts**

### 11.2 Notification Panel
- Click the **Bell icon** in the top bar
- Shows recent notifications (max 50)
- Click **"Clear All"** to dismiss all

### 11.3 Browser Push Notifications
1. Go to **Settings → Notifications**
2. Click **"Enable Notifications"** to permit OS push notifications
3. Click **"Test Notification"** to verify setup

---

## 12. Partner Approvals

*This section is only visible to Super Admin accounts.*

### Viewing Requests
1. Go to **Partner Requests** tab
2. Table shows pending onboarding applications
3. Each request shows: Business Name, Owner, Contact, KYC documents
4. Badge shows pending count

### Approving a Request
1. Click **"Approve"** on a pending request
2. Confirm the action
3. The system automatically:
   - Generates a Business ID and Outlet ID
   - Creates the business node in Firebase
   - Creates the outlet with default settings
   - Creates an admin account
   - Updates the request status to "Approved"

### Rejecting a Request
1. Click **"Reject"** on a pending request
2. Confirm the action
3. The request is removed

---

## 13. Printing

### Thermal Receipts
- Receipts print automatically on POS sale completion
- Click the **Print icon** on any order to reprint
- The **"Print Last"** button in POS reprints the last walk-in receipt
- Receipts use a 58mm thermal format with:
  - Store name and address
  - Order items with quantities and prices
  - GST and totals
  - Payment method
  - Thank-you message
  - QR code for feedback

### Print Settings
- Receipt format is configured in **Settings** (show/hide store name, address, GSTIN, etc.)
- The receipt preview updates in real-time as you configure
