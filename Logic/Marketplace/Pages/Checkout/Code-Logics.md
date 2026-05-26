# Checkout Page — Code Logics

## Overview
Order placement page with fulfillment method, address form, payment selection, and order summary.

## State Variables
| Variable | Type | Description |
|---|---|---|
| `paymentMethod` | `PaymentMethod` | upi / card / wallet / cod |
| `fulfillmentMethod` | `FulfillmentMethod` | delivery / dinein / takeaway |
| `form` | `DeliveryAddress` | Name, phone, address, coords |
| `isProcessing` | boolean | Submit in progress |
| `isFreeDelivery` | boolean | From coupon or threshold |
| `surge` | `SurgeConfig \| null` | Surge pricing multiplier |
| `globalDiscount` | `GlobalDiscount \| null` | Platform-wide discount |
| `outlet` | `Outlet \| null` | Current outlet info |

## Key Logic
- **Fulfillment methods**: Delivery, Dine In, Takeaway — each with icon + description
- **Payment methods**: UPI, Card, Wallet, COD — displayed as selectable cards
- **Address form**:
  - Pre-filled from `user.savedAddresses` (default) or `LocationContext.address`
  - Coordinates sync from LocationContext on mount
  - Extra fields: tableNumber (dine-in), pickupTime (takeaway)
- **Summary**: `calcCartSummary(items, outlet, config, fulfillmentMethod)`
- **Promotions**: Fetches surge config, global discount, validates coupon again
- **Order placement**:
  - Calls `placeOrder(input)` from OrderContext
  - Input: items, outlet, address, payment, fulfillment, promotions, platform fee
  - On success: navigates to `/tracking/{orderId}`
  - On error: toast with error message

## Guest Handling
- If `authState !== "authenticated"` → show Google sign-in button
- Prevents order placement without auth

## Decisions
- Fulfillment method selected before address (Dine-in/Takeaway skips address)
- Promotions fetched fresh on mount (not reused from cart context)
- Coupon re-validated (defense against stale validation)
- Wallet payment deducts from `walletService`
