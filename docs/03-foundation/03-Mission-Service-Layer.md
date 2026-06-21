# Mission Service Layer — Data Service Contracts

Complete catalog of every data service, its signature, inputs, outputs, RTDB paths, and audit emissions. This is the "mission database service" layer — the canonical source for how data moves through the system.

---

## 1. Code-Logics

### Marketplace Services (12 modules)

#### `authService.ts` (86 lines) — Authentication
| Method | Input | Output | RTDB Path | Audit |
|---|---|---|---|---|
| `subscribeToAuthChanges(callback)` | callback fn | unsubscribe fn | — (Firebase Auth SDK) | — |
| `signInWithGoogle()` | — | `User \| null` | — | — |
| `handleRedirectResult()` | — | `User \| null` | — | — |
| `signOut()` | — | void | — | — |
| `requestNotificationPermission(uid)` | user UID | void | `users/{uid}/fcmToken` | — |

#### `orderService.ts` (366 lines) — Order Management
| Method | Input | Output | RTDB Path | Audit |
|---|---|---|---|---|
| `submitOrder(input: PlaceOrderInput)` | bid, oid, items, address, payment, fulfillment, coupon | `string` (orderId) | `businesses/{bid}/outlets/{oid}/orders/{pushId}` | `logMarketplaceAudit('ORDER_PLACED', ...)` |
| `statusIndex(status)` | OrderStatus string | number (pipeline index) | — | — |
| `STATUS_PIPELINE` | — | `string[]` (8 statuses) | — | — |

#### `cartService.ts` (125 lines) — Cart Business Logic
| Method | Input | Output | Notes |
|---|---|---|---|
| `calcCartSummary(items, outlet, promotions, fulfillment)` | cart items, outlet config, promo config, fulfillment method | `CartSummary { subtotal, deliveryFee, taxes, platformFee, total, savings }` | Pure math — GST 5%, coupon/surge/global discount, free delivery, per-100m fee mode |
| `GST_RATE` | — | `0.05` | 5% GST constant |

#### `menuService.ts` — Menu Discovery
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `fetchMenuByOutlet(bid, oid, outletName)` | business ID, outlet ID, outlet name | `MenuItem[]` | Waterfall: businesses/{bid}/outlets/{oid}/dishes → Pizza-Shop/dishes → Cake-Shop/dishes (legacy fallback) |

#### `outletService.ts` — Outlet Discovery
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `fetchOutlets()` | — | `Outlet[]` | `businesses/{bid}/outlets/{oid}/meta` (iterate all businesses) |
| `fetchOutletBySlug(slug)` | slug string | `Outlet \| null` | `slugs/outlets/{slug}` → resolve to businesses/{bid}/outlets/{oid} |

#### `deliveryService.ts` — Delivery Fee Calculation
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `calculateFee(bid, oid, distance)` | business, outlet, distance in km | fee amount | `businesses/{bid}/outlets/{oid}/settings/Delivery.feeSlabs` |
| `getSlabs(bid, oid)` | business, outlet | `DeliveryFeeSlot[]` | Same |

#### `walletService.ts` — Wallet Transactions
| Method | Input | Output | RTDB Path | Audit |
|---|---|---|---|---|
| `getWalletData(uid)` | user UID | `{ balance, history[] }` | `users/{uid}/wallet` | — |
| `debitWallet(uid, amount, orderId)` | uid, amount, orderId | void | `users/{uid}/wallet += -amount` | `logMarketplaceAudit('WALLET_DEBIT', ...)` |
| `creditWallet(uid, amount, orderId)` | uid, amount, orderId | void | `users/{uid}/wallet += amount` | `logMarketplaceAudit('WALLET_CREDIT', ...)` |

#### `notificationService.ts` — Push Notifications
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `requestPermission()` | — | `string` (FCM token) | `users/{uid}/fcmToken` |
| `getFCMToken()` | — | `string \| null` | — |
| `onForegroundMessage(callback)` | callback fn | unsubscribe fn | — |

#### `promotionService.ts` — Coupons & Surge
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `validateCoupon(code, outletId)` | coupon code, outlet | `{ valid, discount, type }` | `system/promotions/coupons/{code}` |
| `getSurgeMultiplier(outletId)` | outlet | `{ multiplier, active }` | `system/promotions/surge` |

#### `reviewService.ts` — Customer Reviews
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `submitReview(bid, oid, review)` | business, outlet, `{ rating, comment }` | void | `businesses/{bid}/outlets/{oid}/reviews/{pushId}` |
| `getReviews(bid, oid)` | business, outlet | `Review[]` | Same path (read) |

#### `auditService.ts` — Audit Logging
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `logMarketplaceAudit(action, details)` | action string, details object | void | `logs/marketplaceAudit/{pushId}` |

#### `configService.ts` — Platform Config
| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `getPlatformConfig()` | — | `{ platformFee }` | `system/config/platformFee` |

---

### Bot Helpers (via `tenantContext`)

| Method | Input | Output | RTDB Path |
|---|---|---|---|
| `t.getData(path)` | relative path | Firebase snapshot value | `resolvePath(path, bid, oid)` |
| `t.setData(path, data)` | path + data | void | Same |
| `t.updateData(path, data)` | path + data | void | Same |
| `t.deleteData(path)` | path | void | Same |
| `t.pushData(path, data)` | path + data | push key | Same |
| `t.getUserProfile(jid)` | WhatsApp JID | profile object | `businesses/{bid}/outlets/{oid}/botUsers/{cleanJid}` |
| `t.saveUserProfile(jid, data)` | JID + data | void | Same |

### Admin Dashboard Helpers

| Method | Input | Output | RTDB Path | Audit |
|---|---|---|---|---|
| `logAudit(bizId, oid, action, details, actor)` | all metadata | void | `businesses/{bizId}/outlets/{oid}/logs/audit/{pushId}` | — |
| `uploadImage(file, storagePath)` | File + path | download URL | Firebase Storage | — |
| `createRiderAuthAccount(email, password)` | email + password | `{ uid, email }` | — (Firebase Auth) | — |
| `deleteRiderAuthAccount(email, password)` | email + password | `{ uid, email }` | — (Firebase Auth) | — |
| `resetRiderPassword(currentPw, newPw, email)` | passwords + email | `{ uid, email }` | — (Firebase Auth) | — |

---

## 2. Firebase-Rules

Every service above targets RTDB paths documented in `docs/03-foundation/03-Database-Security-Rules.md`. The Admin Dashboard's secondary auth helpers access Firebase Auth API directly (not RTDB), using an ephemeral secondary Firebase app to avoid session displacement.

---

## 3. Database-Structure

Every service accesses paths under the canonical tree (see `docs/00-master/00-DATA-MODEL.md`). No custom or ad-hoc paths are used.

---

## 4. Connecting-Nodes

```
[Marketplace checkout]  → orderService  → push to businesses/{bid}/outlets/{oid}/orders
                                   ↘ auditService → push to logs/marketplaceAudit
                                   ↘ walletService → update users/{uid}/wallet (runTransaction)

[Bot order placement]   → t.pushData    → push to businesses/{bid}/outlets/{oid}/orders
                                   ↘ logBotAudit → push to logs/botAudit

[Admin status update]   → update()      → update businesses/{bid}/outlets/{oid}/orders/{id}
                                   ↘ logAudit → push to businesses/{bid}/outlets/{oid}/logs/audit
```

---

## 5. Complete Flow: Place Order (Marketplace)

```
1. Checkout.tsx captures form: name, phone, address, payment method, coupon code
2. Validates inputs (name not blank, phone regex /^[6-9]\d{9}$/, address not blank)
3. Calls orderService.submitOrder({
     businessId, outletId, items, customerName, phone, address,
     lat, lng, paymentMethod, fulfillmentMethod, couponCode, deliveryFee, total
   })
4. submitOrder:
   a. Throws if !businessId or !outletId
   b. Reads businesses/{bid}/commission for platform fee config
   c. Builds full order document with timestamps + status "Placed"
   d. push() to businesses/{bid}/outlets/{oid}/orders/{pushId}
   e. If paymentMethod === "wallet": walletService.debitWallet(uid, total, orderId)
   f. If couponCode: update system/promotions/coupons/{code}.usedCount
   g. logMarketplaceAudit('ORDER_PLACED', { orderId, total, paymentMethod })
   h. Returns newOrderRef.key as orderId
```
