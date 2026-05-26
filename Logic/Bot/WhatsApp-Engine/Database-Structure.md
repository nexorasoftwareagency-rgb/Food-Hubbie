# WhatsApp Engine (whatsapp-engine.js) — Database Structure

## Session (`system/botSessions/{bid}/{oid}/{safeJid}`)
| Field | Type | Description |
|---|---|---|
| `step` | string | Current state machine step |
| `cart` | array | Cart items |
| `current` | object | In-progress selection |
| `activeOutlet` | string/null | Selected outlet ID |
| `activeBid` | string | Selected business ID |
| `lastActivity` | number | Epoch ms |
| `profile` | object/null | Saved user profile |
| `name` | string/null | Customer name |
| `phone` | string/null | Customer phone |
| `address` | string/null | Delivery address |
| `location` | object/null | `{ lat, lng }` |
| `deliveryFee` | number/null | Calculated fee |
| `categoryList` | array | Current outlet's categories |
| `dishList` | array | Current category's dishes |
| `sizeList` | array | Current dish's sizes |
| `discoveryCategories` | array | Global discovery categories |
| `categoryMap` | object | Category → outlets mapping |
| `discoveryList` | array | Sorted nearby outlets |

## Cart Item
| Field | Type | Description |
|---|---|---|
| `name` | string | Dish name |
| `size` | string | Selected size |
| `unitPrice` | number | Per-unit price |
| `addons` | array | Always empty currently |
| `quantity` | number | Qty (1-50) |
| `total` | number | `unitPrice × quantity` |
| `outletId` | string | Outlet this item belongs to |

## Order (created by bot)
| Field | Type | Description |
|---|---|---|
| `orderId` | string | `FH-{ts}-{rand}` |
| `customerName` | string | From user input |
| `phone` | string | 10-digit |
| `whatsappNumber` | string | Full JID |
| `address` | string | Delivery address |
| `lat` | number | From shared location |
| `lng` | number | From shared location |
| `subtotal` | number | Sum of cart totals |
| `deliveryFee` | number | Calculated |
| `total` | number | Subtotal + fee |
| `status` | string | `"Placed"` |
| `paymentMethod` | string | `"Cash"` |
| `paymentStatus` | string | `"Pending"` |
| `createdAt` | string | ISO 8601 |
| `items` | array | Cart items |
| `businessId` | string | Tenant ID |
| `outletId` | string | Outlet ID |
