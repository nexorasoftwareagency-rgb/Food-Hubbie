# Foodhubbie Marketplace — Complete User Manual

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Browsing & Discovering Food](#2-browsing--discovering-food)
3. [Restaurant & Menu](#3-restaurant--menu)
4. [Cart](#4-cart)
5. [Checkout](#5-checkout)
6. [Order Tracking](#6-order-tracking)
7. [Orders History](#7-orders-history)
8. [Profile & Account](#8-profile--account)
9. [Wallet & Payments](#9-wallet--payments)
10. [Coupons & Discounts](#10-coupons--discounts)

---

## 1. Getting Started

### Accessing the Marketplace
- Open the Marketplace URL in your browser (mobile or desktop)
- No account needed to browse — you can browse menus and add items to cart as a guest

### Sign In / Sign Up
1. Click **"Login"** or navigate to `/login`
2. Click **"Continue with Google"** to sign in with your Google account
3. Or click **"Browse as Guest"** to continue without signing in
4. If you're already signed in, you'll be redirected to your profile automatically

### Why Sign In?
- Save your cart across sessions
- View your order history
- Track orders in real-time
- Manage your saved addresses
- Use wallet balance for payments
- Earn loyalty points

---

## 2. Browsing & Discovering Food

### Home Page
The landing page has several sections:

| Section | Description |
|---|---|
| **Hero Banner** | Search bar with tagline "Cravings? Delivered." |
| **Location Detection** | Prompts to detect your location for accurate delivery |
| **Food Categories** | Horizontal scrollable circles (Pizza, Burger, Chinese, etc.) |
| **Trending Now** | Best-selling items across all restaurants |
| **Quick Bites** | Recommended dishes |
| **Explore All Food** | All menu items across restaurants |
| **Reviews** | Recent customer feedback |
| **View All Restaurants** | Link to full restaurant listing |

### Search
1. Use the search bar on the home page or navigate to `/search`
2. Enter a dish name, restaurant name, or cuisine type
3. Results show matching restaurants and dishes
4. Use filters:
   - **All / Restaurants / Dishes** — toggle between result types
   - **Veg Only** — show only vegetarian items
   - **Top Rated / Fast Delivery** — sort preference
   - **Cuisine Chips** — filter by cuisine type
5. Recent searches are saved (last 5)

### Restaurants Listing
1. Navigate to `/outlets` or click "View All Restaurants"
2. Browse all available restaurants
3. Use filters: All, Open Now, Veg Only, Top Rated, Fastest Delivery, Offers
4. Each card shows: Name, Rating, Delivery Time, Distance, Minimum Order

---

## 3. Restaurant & Menu

### Viewing a Restaurant
1. Click any restaurant card
2. The restaurant page shows:
   - **Cover image** and name
   - **Availability badge** (Open/Closed)
   - **Rating**, delivery time, distance, delivery fee, min order
   - **Offers row** — scrollable offer chips
   - **Menu** organized by categories

### Browsing the Menu
- **Sticky category tabs**: All, Recommended, Best Sellers, plus dynamic categories
- Click a category tab to jump to that section
- Use the **Search within menu** bar to find specific dishes

### Food Cards
Each dish card shows:
- Dish image
- Name and description
- Price (starting from)
- Veg/Non-veg indicator
- Rating
- Customization options indicator
- **"ADD"** button

### Adding Items to Cart

**Non-customizable items:**
1. Click **"ADD"** on a food card
2. Item is added to cart with quantity 1

**Customizable items (shows customization modal):**
1. Click **"ADD"** on a food card
2. The **Product Customization Modal** opens:
   - **Select Size** (e.g., Regular, Medium, Large)
   - **Select Add-ons/Toppings** (e.g., Extra Cheese, Mayo)
   - **Adjust Quantity** with +/- buttons
   - **Add Instructions** (optional notes)
   - Live price updates as you customize
3. Click **"Add Item"** to add to cart

### Outlet Switching
- If you have items from Restaurant A and try to add an item from Restaurant B:
  - A dialog appears: **"Start a new cart?"**
  - **"Keep Cart"**: Cancels the action, keeps current items
  - **"Start Fresh"**: Clears current cart, adds the new item

---

## 4. Cart

### Viewing Cart
1. Click the **cart icon** in the header or navigate to `/cart`
2. If cart is empty: "Your cart is empty" with a link to browse restaurants

### Cart Features

| Feature | Description |
|---|---|
| **Items list** | Each item shows: image, name, customization details, price |
| **Quantity adjuster** | +/- buttons on each item |
| **Remove** | Trash icon to remove item |
| **Free Delivery Milestone** | Progress bar toward ₹499 for free delivery |
| **Add more items** | Link to restaurant to add more |
| **Coupon section** | Input field + Apply button |
| **Delivery Instructions** | Optional textarea for rider notes |
| **Savings Celebration** | Green banner showing total savings when coupons/discounts apply |

### Applying a Coupon
1. Enter your coupon code in the input field
2. Click **"Apply"**
3. If valid, the discount appears in the bill summary
4. Click **"Remove"** to remove the applied coupon
5. Suggested coupons like **FIRST50** and **FREESHIP** are shown as hints

### Bill Summary
| Item | Description |
|---|---|
| **Item Total** | Sum of all item prices × quantities |
| **Delivery Fee** | Based on distance and restaurant's fee structure |
| **Coupon Discount** | Discount from applied coupon |
| **GST (5%)** | Tax on the taxable amount |
| **Platform Fee** | Small platform service fee |
| **To Pay** | Final amount |
| **Projected Cashback** | 2% of net food value credited as wallet cashback |

### Proceeding to Checkout
- Click **"Proceed to Checkout"**
- If not logged in, you'll be prompted to sign in first

---

## 5. Checkout

### Fulfillment Method
Choose how you want to receive your order:

| Method | Details |
|---|---|
| **Home Delivery** | Food delivered to your address |
| **Dine In** | You eat at the restaurant (table number) |
| **Takeaway** | You pick up from the restaurant |

### Delivery Details (for Home Delivery)
1. Select a **saved address** (Home, Work, Other) from quick-select chips
2. Or fill in: Name, Phone, Full Address, Landmark

### Dine In Details
- Name, Phone, Table Number, Number of Guests

### Takeaway Details
- Name, Phone, Preferred Pickup Time

### Payment Methods
| Method | Description |
|---|---|
| **UPI** | Enter your UPI ID (e.g., name@upi) |
| **Credit/Debit Card** | Card payment (via gateway) |
| **Wallet** | Pay with Foodhubbie wallet balance |
| **Cash on Delivery** | Pay cash to rider |

### Order Summary (Right Panel on Desktop)
- Review all items, quantities, and pricing
- Item Total, Delivery Fee/Dine-in Fee/Takeaway Fee
- GST (5%), Platform Fee
- Surge pricing (if active)
- Coupon and global discounts
- Cashback projection
- **Total to Pay**

### Placing the Order
1. Review all details carefully
2. Click **"Pay/Place Order"** or the appropriate payment button
3. The system processes:
   - Wallet debit (if wallet payment)
   - Order written to restaurant
   - Coupon usage recorded
   - Inventory deducted
   - Cashback credited (2% of net food value)
4. You're redirected to the **Tracking** page

### If Wallet Payment Fails
- If wallet is debited but the order write fails, the amount is **automatically refunded** to your wallet

---

## 6. Order Tracking

### Live Tracking Page
After placing an order, you're redirected to `/tracking/{orderId}`.

### What You See
| Element | Description |
|---|---|
| **Order ID** | Reference number |
| **ETA Countdown** | Starts at 35 minutes, counts down every 60 seconds |
| **Timeline** | Animated step progress through the order lifecycle |
| **Rider Card** | Appears when the rider is out for delivery |

### Order Timeline Steps
1. **Placed** ✓ — Your order is received
2. **Confirmed** ✓ — Restaurant accepted
3. **Preparing** ✓ — Being cooked
4. **Cooked** ✓ — Done cooking
5. **Ready** ✓ — Packed and ready
6. **Out for Delivery** ✓ — Rider is on the way
7. **Reached Drop Location** ✓ — Rider has arrived
8. **Delivered** ✓ — Enjoy your meal!

### Rider Information
When status reaches "Out for Delivery", you'll see:
- Rider name and photo
- Vehicle type
- **Call button** — tap to call the rider
- Map placeholder with rider location (coming soon)

### After Delivery
- **Success animation** with checkmark
- **"Rate Now"** button to review the food and rider
- **"Continue Ordering"** link to order more

---

## 7. Orders History

### Viewing Past Orders
1. Navigate to `/orders`
2. All your past orders are listed, sorted by date (newest first)

### Each Order Card Shows
- Restaurant name and order date
- Order ID
- **Status badge** (color-coded):
  - **Green**: Delivered
  - **Red**: Cancelled
  - **Blue**: Out for Delivery
  - **Secondary**: Preparing/Ready
- Items list with quantities
- Total amount

### Actions on Past Orders
| Action | Description |
|---|---|
| **Rate Order** | Opens review modal (only for delivered, unrated orders) |
| **Reorder** | Clears current cart and adds all items from this order |
| **Track** | Navigates to the tracking page (for active orders) |

### Rating & Reviews
1. Click **"Rate Order"** on a delivered order
2. Select a **star rating** (1-5)
3. Optionally rate the **rider**
4. Add a written **comment**
5. Submit your review

---

## 8. Profile & Account

### Accessing Profile
1. Navigate to `/profile`
2. If not logged in, you'll be redirected to login

### Profile Header
- **Avatar**: Your Google profile photo (or auto-generated fallback)
- **Name**: Your display name (click to edit inline)
- **Phone**: Registered phone number
- **Email**: Your email address
- **Foodhubbie Premium badge** (if applicable)

### Quick Stats
| Stat | Description |
|---|---|
| **Orders** | Total orders placed |
| **Wallet** | Current wallet balance |
| **Loyalty Points** | Accumulated loyalty points |

### Account Sections

**Account & Security:**
- **Manage Addresses** — View/add/delete saved delivery addresses
- **Payments & Wallets** — View wallet balance and payment methods

**Preferences:**
- **Your Favorites** — Favorite restaurants and dishes
- **Account Settings** — Notification and privacy toggles

**Support:**
- **Help & Support** — Contact information
- **Legal & Privacy** — Terms and policies

### Managing Addresses
1. Click **"Manage Addresses"**
2. Existing addresses are listed with label (Home/Work/Other)
3. Click **"Add New Address"**:
   - Select label: Home / Work / Other
   - Enter full address
   - Add landmark (optional)
   - Click **"Save"**
4. Click **Delete icon** to remove an address

### Profile Settings
- **Notifications toggle**: Receive push notifications
- **SMS Alerts toggle**: Receive SMS updates
- **Privacy / App Appearance**: Visual-only settings

### Logging Out
- Scroll to the bottom of profile
- Click **"Log Out"**
- Confirm the action

---

## 9. Wallet & Payments

### Wallet Overview
Your Foodhubbie Wallet stores:
- **Balance**: Available funds for orders
- **History**: All credit and debit transactions

### How Wallet Gets Credited
- **Cashback**: 2% of net food value on every completed order
- **Manual credit**: Only by SuperAdmin (for refunds, promotions)

### Using Wallet for Payment
1. During checkout, select **"Wallet"** as payment method
2. Ensure your balance is sufficient for the total
3. The amount is debited instantly when you place the order

### Viewing Payment Methods
1. In Profile, click **"Payments & Wallets"**
2. View your wallet balance and transaction history
3. Saved payment methods (cards, UPI) can be managed here

---

## 10. Coupons & Discounts

### Available Coupon Types
| Type | Example | Description |
|---|---|---|
| **Percentage off** | FIRST50 (50% off up to ₹100) | Discount based on percentage |
| **Fixed amount off** | FLAT50 (₹50 off) | Fixed rupee discount |
| **Free delivery** | FREESHIP | Waives delivery fee |

### How Coupons Work
1. Coupons require a **minimum order value** (e.g., min ₹299)
2. Coupons have a **usage limit** (e.g., 100 uses total)
3. Coupons can be **active** or **inactive** (set by admin)

### Applying a Coupon
1. On Cart page, enter the coupon code in the input field
2. Click **"Apply"**
3. The system validates: active status, minimum order, usage limit
4. If valid: discount is applied and shown in the bill summary
5. If invalid: an error message explains why

### Global Discounts
Occasionally, the platform runs **global discounts** (e.g., 10% off everything). These are applied automatically and stack with coupons.

### Surge Pricing
During peak hours, **surge pricing** may apply to delivery fees (e.g., 1.5× normal rate). This is shown in the bill summary before checkout.

---

## Quick Reference

| Action | How |
|---|---|
| Browse food | Home page or `/outlets` |
| Search dishes | Search bar or `/search?q=...` |
| View menu | Click a restaurant card |
| Add to cart | Click "ADD" on a dish |
| Apply coupon | Cart page → enter code → Apply |
| Checkout | Cart → "Proceed to Checkout" |
| Track order | `/tracking/{orderId}` after placing |
| View history | `/orders` |
| Edit profile | `/profile` |
| Rate order | Orders page → "Rate Order" |
| Contact rider | Tracking page → Call/WhatsApp buttons |
| Payment methods | Profile → Payments & Wallets |
| Saved addresses | Profile → Manage Addresses |
