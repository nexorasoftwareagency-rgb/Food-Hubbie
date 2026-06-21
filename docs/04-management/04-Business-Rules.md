# Business Rules — Pricing, Commission, Promotions

Canonical specs for delivery fee, platform fee, GST, coupon system, surge pricing, and commission. Every hardcoded constant, every branching condition, every edge case.

---

## 1. Code-Logics

### Delivery Fee (3 modes — `cartService.ts` calc)

| Mode | Condition | Calculation | Example |
|---|---|---|---|
| **Per-100m** | `settings.Delivery.mode === "per100m"` | `distanceKm * slabs[i].per100m * max(1, ceil(dist / 0.1))` | 2.3 km × ₹2/100m = ₹46 |
| **Slab-based** | `settings.Delivery.mode === "slab"` | Slab lookup by distance + base + per-km addon | Base ₹30 + 2 km × ₹10 = ₹50 |
| **Free** | `settings.Delivery.mode === "free"` | `0` (threshold-based: free above `minCartValue`) | — |

System-level fallback (`system/settings/delivery`):
- `mode`: `"per100m"`
- `per100mRate`: `2`
- `slabs[0]`: `{ min: 0, base: 30, perKm: 10 }`

### Platform Fee (`system/config/platformFee`)
- Default: `₹10` per order
- Configurable via SuperAdmin → Settings tab

### GST (`cartService.ts:GST_RATE`)
- Constant: `5%` (`0.05`)
- Applied to subtotal before discounts

### Coupon System

| Field | Source | Logic |
|---|---|---|
| `code` | `system/promotions/coupons/{code}` | Case-insensitive match |
| `type` | `"percentage"` or `"fixed"` | Determines discount calc |
| `value` | Number | For percentage: `subtotal * value / 100` (cap at `maxDiscount`). For fixed: `min(value, subtotal)` |
| `minCartValue` | Number | Coupon invalid if subtotal < this |
| `maxDiscount` | Number | Percentage coupons capped here |
| `validFrom` / `validUntil` | ISO timestamp | Coupon ignored outside window |
| `usedCount` | Number | Incremented on use; `maxUses` gate |
| `applicableOutlets` | `string[]` | If empty → all outlets. If non-empty → outlet must be in list |

### Surge Pricing (`system/promotions/surge`)
- `active`: boolean — if true, multiplies delivery fee by `multiplier`
- `multiplier`: number — usually `1.5`–`2.0`
- Toggled manually by SuperAdmin during peak hours

### Global Discount (`system/promotions/globalDiscount`)
- `active`: boolean
- `type`: `"percentage"` or `"fixed"`
- `value`: number
- Applied after coupon, before GST

### Commission (`businesses/{bid}/commission`)
| Field | Type | Default |
|---|---|---|
| `rate` | number (percentage) | `10` |
| `type` | `"percentage"` or `"fixed"` | `"percentage"` |
| `platformFeeOnCommission` | boolean | `false` |

### Free Delivery Threshold (`settings.Delivery.freeDeliveryAbove`)
- If mode is `"free"`: delivery is free when subtotal exceeds this value
- If mode is `"per100m"` or `"slab"`: delivery fee waived when subtotal exceeds this (if set)

### Order Status Pipeline (9 states)
`Placed → Confirmed → Preparing → Cooked → Ready → Accepted → Picked → Delivered → Completed`

Cancellation paths:
- `Placed → Cancelled` (customer-initiated, before confirmation)
- `Confirmed → Rejected` (admin-initiated, out-of-stock)
- `Accepted → Cancelled` (rider drops order)
- `Delivered → Return Requested → Returned` (customer returns item)

### Lost Sales Tracking
When `orderService.submitOrder()` is called with `paymentMethod === "cash"`, an entry is pushed to `logs/lostSales/{pushId}` with the cart contents if the order is not confirmed within 30 minutes (admin-side timeout detection).

---

## 2. Firebase-Rules

Business rules enforced via validation in `database.rules.json`:
- `orders/{id}/total` must be a positive number (`.validate: "newData.isNumber() && newData.val() > 0"`)
- `orders/{id}/status` must be one of the 9 enumerated statuses
- `orders/{id}/items` must be an array with at least 1 item
- `orders/{id}/paymentMethod` must be `"cash"` or `"wallet"`
- `orders/{id}/fulfillment` must be `"delivery"` or `"pickup"`

---

## 3. Database-Structure

All business rules configuration is stored in:
- `businesses/{bid}/commission` — commission rate and type
- `businesses/{bid}/outlets/{oid}/settings/Delivery` — delivery fee slabs, mode, free delivery threshold
- `system/settings/delivery` — system-wide delivery defaults (fallback)
- `system/config/platformFee` — per-order platform fee
- `system/promotions/{coupons, surge, globalDiscount}` — promotional data
- `system/commissions/{bid}` — legacy commission path (read-only fallback)

---

## 4. Connecting-Nodes

```
[Marketplace cart update]
  → cartService.calcCartSummary(items, outlet.settings, promotions, fulfillment)
  → reads: settings.Delivery, promotions.coupons, promotions.surge, promotions.globalDiscount
  → writes: (none — pure function)
  → returns: CartSummary

[Marketplace checkout]
  → orderService.submitOrder()
  → reads: businesses/{bid}/commission, system/config/platformFee
  → writes: businesses/{bid}/outlets/{oid}/orders/{pushId}, users/{uid}/wallet, logs/marketplaceAudit
  → validates all business rules before write
```

---

## 5. Complete Flow: Cart Total Calculation

1. Subtotal = sum of (`item.price * item.quantity`) for all cart items
2. Coupon discount: if valid coupon code provided, apply `type`/`value` rules
3. Global discount: if active, apply on top of coupon-discounted subtotal
4. Delivery fee: check `settings.Delivery.mode` → calculate via slab/per100m/free
5. Free delivery threshold: if subtotal > `freeDeliveryAbove`, delivery fee = 0
6. Surge: if active, multiply delivery fee by multiplier
7. GST: `5%` of (subtotal after discounts, before delivery fee)
8. Platform fee: read from `system/config/platformFee`
9. Total = subtotal − coupon discount − global discount + delivery fee + GST + platform fee
10. Savings = original delivery fee (before free/surge) + coupon discount value

---

## 6. Roshani Pizza Bot — Discount Control Panel (v4.14.8)

Separate from the platform-level coupon system above. Implemented in `bot/discount-engine.js` + `Admin/js/features/discount-evaluator.js`.

### Discount Types
| Type | Condition | Priority |
|---|---|---|
| `firstOrder` | `!customers/{phone}.firstOrderDiscountUsed` | 4 (highest) |
| `coupon` | Customer enters code at checkout | 3 |
| `global` | Applies to all orders | 2 |
| `category` | Cart contains items in `categoryIds` | 1 (lowest) |

### Discount Modes
- **percent**: `subtotal × (value / 100)`, capped at `maxCap`
- **fixed**: flat ₹ amount, capped at subtotal

### Exclusivity
- `stackable: false` (default) — only one discount applies per group
- `exclusiveGroup: "welcome"` — only one per group can apply
- Stackable discounts sum together (no cap between them)

### Time Window
- `startsAt` / `endsAt` stored as UTC ms
- UI displays in IST
- Evaluation uses `Date.now()` — no TZ math at evaluation time

### Audit Trail
- Every order: `discountSource`, `discountId`, `discountLabel` persisted
- `discountsUsage/{id}` written per redemption
- `discounts/{id}/stats` bumped atomically (`runTransaction`)

### Feature Flag
- `discounts/featureEnabled: false` → evaluator returns null, UI hides tab
- Default: true (null/undefined = enabled)

See `Logic/Bot/Discount-Engine/` and `Logic/Admin-Dashboard/Discounts/` for full documentation.

---

## 7. Roshani Pizza Bot — Promotions Module (v4.14.9)

Bulk WhatsApp campaign system. Admin composes message → bot sends to recipients with 2s delay.

### Safety Rules
- 2s default delay between sends
- 30s pause every 50 sends
- Quiet hours: 10:00–21:00 IST (configurable)
- Max 500 recipients per campaign
- Kill-switch: `bot/{outlet}/promotions/killSwitch = true`
- Concurrency lock: one active campaign per outlet
- Per-send socket health check
- Crypto-error auto-pause at >100

### STOP/START Opt-out
- `STOP | unsubscribe | opt-out` → added to opt-out list
- `START` → re-opted-in
- Promotional consent required (`customers/{phone}.promotionalConsent`)

### Personalization Tokens
| Token | Source |
|---|---|
| `{name}` | `botUsers/{jid}.name` → `customers/{phone}.name` → "Customer" |
| `{phone}` | Phone number |
| `{lastOrderDate}` | `customers/{phone}.lastOrderDate` |
| `{storeName}` | `settings/Store.storeName` |
| `{couponCode}` | Generated per-recipient (if enabled) |

See `Logic/Bot/Promotions/` and `Logic/Admin-Dashboard/Promotions/` for full documentation.
