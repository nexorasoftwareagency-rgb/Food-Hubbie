---

## **Part 0: Global Discovery Mode (Scalability Flow)**

*When the Bot is configured in 'GLOBAL' mode, it acts as a discovery engine for 20+ shops.*

### **1. Welcome & Location Request**
**Bot Sends:**
✨ *WELCOME TO FOODHUBBIE* ✨

Find the best flavors near you! 🍕🍰

🌐 *BROWSE ONLINE:* https://foodhubbie.com
_(Search all 20+ shops instantly!)_

📍 *SHARE YOUR LOCATION* to find nearby outlets via Chat:

1️⃣ Click 📎 or +
2️⃣ Select 'Location'
3️⃣ 'Send Current Location'

---

### **2. Category Discovery**
*Bot aggregates unique categories from all outlets within 10 kms.*
**Bot Sends:**
🤔 *WHAT WOULD YOU LIKE TO ORDER?*

1️⃣  Burgers
2️⃣  Cakes
3️⃣  Desserts
4️⃣  Pizzas

_Reply with a number to see shops_

---

### **3. Nearby Outlet Discovery**
*Bot filters outlets serving the selected category within 10 kms.*
**Bot Sends:**
📍 *SHOPS SERVING PIZZAS* 🏘️

1️⃣  *Pizza Hub* (0.5 km)
2️⃣  *Burger King* (2.1 km)
3️⃣  *Taco Bell* (4.2 km)

_Select a shop to view its menu_

---

### **4. Context Switching**
**User Replies:** `1`
**Bot Sends:** ✨ Entering *Pizza Hub*...
*(Flow then proceeds to Part 1: Initial Greeting & Category Discovery)*

---

## **Part 1: Shop-Specific Ordering Flow**
**Bot Sends:**
✨ *FOODHUBBIE PIZZA* ✨
🌐 *Order Online:* https://foodhubbie.com

🍽️ *SELECT CATEGORY*

1️⃣  Classic Pizzas
2️⃣  Premium Pizzas
3️⃣  Sides & Drinks
4️⃣  Desserts

🛒 *9* View Cart
_Reply with a number to browse_

---

### **2. Dish Selection**
**User Replies:** `1`
**Bot Sends:**
🍽️ *CLASSIC PIZZAS*

1️⃣  *Margherita*
2️⃣  *Farmhouse*
3️⃣  *Peppy Paneer*
4️⃣  *Veggie Paradise*

🛒 *9* View Cart
0️⃣ *Back to Categories* 🔙

---

### **3. Size Customization**
**User Replies:** `2`
**Bot Sends:**
📏 *SELECT SIZE*

1️⃣  Regular — ₹199
2️⃣  Medium — ₹349
3️⃣  Large — ₹599

0️⃣ *Back* 🔙

---

### **4. Quantity Collection**
**User Replies:** `2`
**Bot Sends:**
🔢 *ENTER QUANTITY*

How many *Farmhouse (Medium)* would you like?

_Example: 1, 2, 5, etc._
0️⃣ *Back* 🔙

---

### **5. Cart Management**
**User Replies:** `1`
**Bot Sends:**
✅ *ADDED TO CART!* 🛒

1. *Farmhouse* (Medium) x1 = ₹349

💰 *Subtotal: ₹349*

1️⃣  *Add More Items* 🍕
2️⃣  *Proceed to Checkout* 🚀
3️⃣  *Clear Cart* 🗑️
0️⃣ *Back* 🔙

---

### **6. Profile Verification (Return Customer)**
**User Replies:** `2`
**Bot Sends:**
👤 *REUSE SAVED DETAILS?*

Name: Rajesh Kumar
Phone: 9876543210
Address: Flat 402, Green Valley

1️⃣ Yes, use these
2️⃣ No, enter new details

---

### **7. Delivery Information (New Customer)**
*If User selects '2' or is a New Customer*
**Bot Sends:** `👤 STEP 1: ENTER YOUR FULL NAME`
**Bot Sends:** `📞 STEP 2: ENTER YOUR 10-DIGIT MOBILE NUMBER`
**Bot Sends:** `🏠 STEP 3: ENTER YOUR DELIVERY ADDRESS`

---

### **8. Geolocation Sharing**
**Bot Sends:**
📍 *SHARE YOUR LOCATION* 🌍

Please share your *Live* or *Current* location to calculate delivery fee.

1️⃣ Click 📎 or +
2️⃣ Select 'Location'
3️⃣ 'Send Current Location'

---

### **9. Final Order Summary & Fee Calculation**
*Bot calculates distance (e.g., 2.5km) and applies tiered delivery fee.*
**Bot Sends:**
🧾 *ORDER SUMMARY*
━━━━━━━━━━━━━━━━━━━━
• Farmhouse (Medium) x1 = ₹349
━━━━━━━━━━━━━━━━━━━━
💰 Subtotal: ₹349
🚚 Delivery (2.5km): ₹40
💵 *TOTAL: ₹389*
💳 *Payment:* Cash on Delivery
━━━━━━━━━━━━━━━━━━━━
1️⃣ Confirm Order ✅
2️⃣ Cancel ❌

---

### **10. Order Placement Success**
**User Replies:** `1`
**Bot Sends:**
🎉 *ORDER PLACED!* 🎉
━━━━━━━━━━━━━━━━━━━━
🆔 *Order ID:* #FH-123456
🚚 *Status:* Placed
💰 *Total:* ₹389
━━━━━━━━━━━━━━━━━━━━
_We will notify you once confirmed!_

---

### **11. Real-Time Status Notifications**
**Bot Sends (When Admin Confirms):**
✅ *ORDER CONFIRMED!* 🎊
━━━━━━━━━━━━━━━━━━━━
Your order #FH-123456 has been confirmed and is being prepared! 👨‍🍳

**Bot Sends (When Rider Picks Up):**
🛵 *OUT FOR DELIVERY!* 🚀
━━━━━━━━━━━━━━━━━━━━
Our rider is on the way! 🛵💨

🆔 *Order:* #FH-123456
🔑 *OTP:* 4829
💰 *Total:* ₹389

_Please share the OTP ONLY with the rider._

**Bot Sends (When Order is Being Prepared):**
👨‍🍳 *PREPARING YOUR MEAL* 🔥
━━━━━━━━━━━━━━━━━━━━
Chef is working on your order #FH-123456! It'll be ready soon.

**Bot Sends (When Order is Packed):**
📦 *ORDER PACKED* ✨
━━━━━━━━━━━━━━━━━━━━
Your order #FH-123456 has been packed and is ready for pickup!

**Bot Sends (When Order is Delivered):**
✅ *DELIVERED!* 🍕❤️
━━━━━━━━━━━━━━━━━━━━
Enjoy your delicious meal! 🙏

_Thank you for choosing Foodhubbie._

**Bot Sends (When Order is Cancelled):**
❌ *ORDER CANCELLED*
━━━━━━━━━━━━━━━━━━━━
We're sorry, your order #FH-123456 has been cancelled.
━━━━━━━━━━━━━━━━━━━━
_Reply with any message to start a new order._

---

## **Part 2: Website Booking Notification Flow**

This flow describes the automated multi-channel alerts triggered when a customer places an order on the Foodhubbie Marketplace (Website).

### **1. Admin WhatsApp Alert (New Order)**
**Bot Sends (To Admin Phone):**
🔔 *NEW WEBSITE ORDER!* 🚀
━━━━━━━━━━━━━━━━━━━━
🆔 *Order:* #FH-A8B2C
👤 *Customer:* Rajesh Kumar
📞 *Phone:* 9876543210
📍 *Address:* Flat 402, Green Valley

📦 *Items:*
- 2x Farmhouse Pizza (Medium)
- 1x Garlic Breadsticks
- 3x Pepsi (500ml)

💰 *Total:* ₹849
━━━━━━━━━━━━━━━━━━━━
_Action required: Confirm order in Admin Dashboard._

---

### **2. Admin App Push Notification**
**System Sends (To ShopAdmin App):**
**Title:** 🆕 New Website Order!
**Body:** Order #FH-A8B2C from Rajesh Kumar (₹849)

---

### **3. Customer Confirmation (Post-Admin Action)**
*Triggered when Admin clicks "Confirm" in the ShopAdmin Dashboard.*
**Bot Sends (To Customer WhatsApp):**
✅ *ORDER CONFIRMED!* 🎊
━━━━━━━━━━━━━━━━━━━━
Your order #FH-A8B2C has been confirmed and is being prepared! 👨‍🍳

💰 *Total:* ₹849
━━━━━━━━━━━━━━━━━━━━
_We will notify you once it's out for delivery._
