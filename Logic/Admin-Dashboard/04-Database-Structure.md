# Admin Dashboard — Database Structure

## Firebase Project

- **Project ID:** `food-hubbie`
- **Database:** Realtime Database `food-hubbie-default-rtdb`
- **Storage:** `food-hubbie.firebasestorage.app`
- **Auth:** Firebase Email/Password

## Root Node: `admins/{uid}`

Admin-to-outlet mapping, read on auth.

| Field | Type | Description |
|---|---|---|
| `businessId` | string | Business identifier |
| `outletId` | string | Outlet identifier |
| `outletName` | string | Display name for outlet |
| `outletAddress` | string | Outlet address for receipts |

## Root Node: `businesses/{businessId}/outlets/{outletId}/`

All outlet-scoped data lives here.

### `orders/{orderId}/`

| Field | Type | Description |
|---|---|---|
| `orderId` | string | Date-based order ID (e.g., "20260525-0001") |
| `customerName` | string | Customer's name |
| `phone` | string | Customer phone |
| `cart` | array | Array of items: `[{name, qty, price, size, addons}]` |
| `subtotal` | number | Sum of item prices × qty |
| `discount` | number | Discount amount (subtotal × disc%/100), stored as computed value |
| `tax` | number | Tax amount ((subtotal - discount) × 0.05) |
| `total` | number | Grand total (subtotal - discount + tax) |
| `status` | string | One of: Placed, Confirmed, Preparing, Cooked, Ready, Out for Delivery, Reached Drop Location, Delivered, Cancelled |
| `type` | string | `"delivery"`, `"dinein"`, or `"takeaway"` |
| `paymentMethod` | string | `"Cash"`, `"UPI"`, or `"Card"` |
| `paymentStatus` | string | `"Paid"` when delivered (set by status update, not by POS creation) |
| `riderId` | string | Assigned rider ID |
| `assignedRider` | string | Rider name (denormalized) |
| `riderName` | string | Rider display name |
| `riderPhone` | string | Rider phone |
| `assignedAt` | timestamp | When rider was assigned |
| `address` | string | Delivery address text |
| `lat` | number | Delivery latitude |
| `lng` | number | Delivery longitude |
| `notes` | string | Order notes / special instructions |
| `outletAddress` | string | Outlet address (for receipts) |
| `outlet` | string | Outlet ID (`_outletId`) |
| `createdAt` | string/timestamp | Order creation time |
| `updatedAt` | timestamp | Last update time |

### `metadata/` (under outlet root, not under orders/)

| Field | Type | Description |
|---|---|---|
| `orderSequence` | number | Incremented for each new POS order (used for order ID generation) |

### `dishes/{dishId}/`

| Field | Type | Description |
|---|---|---|
| `name` | string | Dish name |
| `category` | string | Category ID reference |
| `price` | number | Base price |
| `image` | string | Image URL |
| `order` | number | Display order |
| `stock` | number | Available stock quantity |
| `threshold` | number | Low stock threshold |
| `sizes` | object or null | Size options: `{ "Small": 100, "Medium": 150, "Large": 200 }` |
| `addons` | object or null | Addon options: `{ "Extra Cheese": 30, "Mayo": 20 }` |
| `veg` | boolean | Is vegetarian |
| `best` | boolean | Is best-seller |

### `categories/{categoryId}/`

| Field | Type | Description |
|---|---|---|
| `name` | string | Category name |
| `image` | string | Image URL |
| `order` | number | Display order |
| `addons` | object or null | Category-level addons: `{ "Extra Cheese": 30 }` |

### `customers/{phone}/`

| Field | Type | Description |
|---|---|---|
| `name` | string | Customer name |
| `registeredAt` | timestamp | First order timestamp |
| *(other fields from order aggregation)* | | Merged from order history |

### `settings/Store/`

| Field | Type | Description |
|---|---|---|
| `entityName` | string | Business entity name |
| `storeName` | string | Store display name |
| `address` | string | Store address |
| `gstin` | string | GSTIN (15 chars) |
| `fssai` | string | FSSAI license (14 digits) |
| `tagline` | string | Store tagline |
| `poweredBy` | string | "Powered by" text |
| `wifiName` | string | WiFi SSID |
| `wifiPass` | string | WiFi password |
| `instagram` | string | Instagram URL |
| `facebook` | string | Facebook URL |
| `reviewUrl` | string | Google review URL |
| `lat` | number | Store latitude |
| `lng` | number | Store longitude |
| `shopOpenTime` | string | Opening time (e.g., "09:00") |
| `shopCloseTime` | string | Closing time (e.g., "22:00") |
| `updatedAt` | timestamp | Last update |

### `settings/Delivery/`

| Field | Type | Description |
|---|---|---|
| `developerPhone` | string | Developer contact |
| `reportPhone` | string | Report issues phone |
| `notifyPhone` | string | Notification phone |
| `backupCode` | string | 4-digit backup code |
| `slabs` | array | Delivery fee slabs: `[{ km: 2, fee: 20 }, { km: 5, fee: 40 }]` |

## Root Node: `riders/{riderId}`

Shared across outlets (top-level, not scoped under business/outlet).

| Field | Type | Description |
|---|---|---|
| `name` | string | Rider name |
| `phone` | string | Rider phone |
| `email` | string | Rider email |
| `vehicle` | string | Vehicle type |
| `status` | string | `"Online"`, `"On Delivery"`, `"Offline"` |
| `location` | object | `{ lat: number, lng: number }` |
| `earnings` | number | Total earnings |
| `deliveries` | number | Delivery count |
| `rating` | number | Average rating |
| `zone` | string | Delivery zone |
| `joinedAt` | timestamp | Join date |

## Data Relationships

```
admins/{uid} ──businessId──► businesses/{businessId}
              ──outletId──► businesses/{businessId}/outlets/{outletId}

orders/{orderId}.riderId ────► riders/{riderId}
orders/{orderId}.cart[].name ──► dishes/{dishId}.name (denormalized)
dishes/{dishId}.category ──────► categories/{categoryId}
customers/{phone} ──────────────► orders[].phone (aggregated)
settings/Store ─────────────────► outlet-level config
settings/Delivery ───────────► outlet-level config
```

## Firebase Storage Paths

- `images/{businessId}/{outletId}/dishes/{fileName}` — Dish images
- Uploaded via `uploadImage(file, storagePath)` in `firebase.js`
- Deleted via `deleteImage(url)` (parses URL to extract path)
