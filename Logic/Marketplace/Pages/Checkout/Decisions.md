# Checkout Page — Decisions

| Decision | Rationale |
|---|---|
| **Fulfillment method first** | Changes available payment options and address requirements |
| **Promotions re-fetched on mount** | Ensures fresh surge/discount data at checkout time |
| **Coupon re-validated** | Prevents stale/expired coupon from being applied |
| **Address pre-filled from user profile** | Faster checkout for returning users |
| **Google sign-in wall for guests** | Order requires userId for Firebase storage |
| **Wallet option shows balance** | User can see available funds before selecting |
| **Dine-in shows table number field** | Restaurant needs table assignment |
| **Takeaway shows pickup time** | Customer selects when to collect |
