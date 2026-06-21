# Complete Flow: Bot Discount Engine

## 1. Customer reaches checkout
```
CART_VIEW → user picks "2" (proceed)
```

## 2. AWAIT_COUPON step (new in v4.14.8)
```
Bot: "🎟 Have a coupon code? Reply with it, or type 0 to skip."
User: "FESTIVE5" (or "0" to skip)
```
- If code provided → `validateCouponCode(OUTLET, code)` → match: store `user.couponCode = "FESTIVE5"`, show "✅ Coupon applied!"
- No match → "❌ Invalid code. Try again or reply 0 to skip."
- If "0" → `user.couponCode = null`

## 3. REUSE_PROFILE / NAME flow continues
Same as before — bot collects delivery address, confirms order.

## 4. processOrderPlacement
```
1. Compute subtotal from cart
2. Load customer record: customers/{phone}
3. Call evaluateDiscount({ OUTLET, customer, subtotal, couponCode, cart })
4. If result: user.discount = result.amount, user.discountLabel = result.label, user.discountSource = result.source
5. If manual override (POS): manual discount wins, discountSource = "manual"
6. total = subtotal + deliveryFee - (user.discount || 0)
```

## 5. Order persisted
```
orders/{orderId}/
  discount: user.discount (₹ amount)
  discountId: result.discount.id
  discountLabel: result.label
  discountSource: result.source
```

## 6. Usage recorded
```
discountsUsage/{usageId}/
  discountId, discountLabel, orderId, customerPhone,
  amountGiven, appliedAt, channel: "whatsapp"
```

## 7. Stats bumped (atomic)
```
discounts/{discountId}/stats/
  usedCount: runTransaction(++cur.usedCount)
  totalDiscountGiven: runTransaction(cur.totalDiscountGiven + amount)
  lastUsedAt: Date.now()
```

## 8. Customer record updated (firstOrder only)
```
customers/{phone}/
  firstOrderDiscountUsed: Date.now()
  firstOrderDiscountId: discountId
```

## 9. Invoice formatted
```
🎁 Discount (Festive 5%): -₹50
```
Added to 5 invoice spots in bot/index.js (lines 526, 1110, 1176, 1249, 1942).

## 10. Cross-page flows
- **Admin Dashboard** — Discounts tab shows all definitions, usage stats, reports
- **Admin POS** — auto-discount preview in cart, manual override wins
- **Bot** — coupon code entered during checkout, auto-discount applied silently
- **Promotions** — coupon codes can be generated per-recipient in promotional messages
