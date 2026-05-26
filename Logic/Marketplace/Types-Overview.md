# Types — Overview

## Source
`src/types/index.ts` — 252 lines, all domain types.

## Type List
| Type | Fields | Description |
|---|---|---|
| `AvailabilityStatus` | `"open" \| "closed" \| "busy" \| "closing_soon"` | Outlet status |
| `Coordinates` | `lat, lng` | GPS coordinates |
| `Offer` | `id, label, type, value?` | Promotional offer |
| `Outlet` | 21 fields | Full outlet including name, slug, cuisine, rating, delivery time, location, offers |
| `DeliveryFeeSlot` | `upToKm, fee` | Slab-based fee bracket |
| `DeliveryFeeMode` | `"per_100m" \| "slabs"` | Fee calculation mode |
| `DeliveryFeeConfig` | `mode, per100mRate, slabs` | Fee configuration |
| `MenuItemAddon` | `id, name, price` | Addon option |
| `MenuItemSize` | `id, name, price` | Size option |
| `MenuItemCrust` | `id, name, extraPrice` | Crust option (pizza) |
| `MenuItem` | 22 fields | Full menu item with all options |
| `CartItemCustomization` | `size?, crust?, addons, extraCheese, instructions` | Item customization |
| `CartItem` | 9 fields | Cart item with computed price |
| `OrderStatus` | 9 statuses | Placed → Delivered + Cancelled |
| `PaymentMethod` | `"upi" \| "card" \| "wallet" \| "cod"` | Payment options |
| `FulfillmentMethod` | `"delivery" \| "dinein" \| "takeaway"` | Fulfillment options |
| `OrderItem` | 6 fields | Item in an order |
| `DeliveryAddress` | 9 fields | Full delivery address with coords |
| `Order` | 22 fields | Full order with status history, discounts, rider info |
| `UserAddress` | `id, label, address, landmark?, coords, isDefault` | Saved address |
| `PositiveNumber` | branded number | Positive number brand type |
| `WalletTransaction` | `id, amount, type, description, orderId?, createdAt` | Wallet entry |
| `User` | 9 fields | Full user profile with wallet |
| `Review` | 11 fields | Review with rider rating |
| `ScheduleSlot` | `label, time` | Time slot |

## Notes
- Cartesian type matches the Firebase RTDB document structure
- `PositiveNumber` uses TypeScript branded types (compile-time check only)
- `toPositiveNumber(val)` helper clamps negative/NaN to 0
- All types exported as `export type` (type-only exports)
- `OrderStatus` as union type ensures type-safe status transitions
