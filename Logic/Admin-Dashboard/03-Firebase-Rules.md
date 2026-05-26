# Admin Dashboard — Firebase Rules

## Rules File

Located at `D:\Foodhubbie\database.rules.json`

## Database Layout

```
/food-hubbie-default-rtdb/
├── admins/
│   └── {uid}/
│       ├── businessId: string
│       ├── outletId: string
│       ├── outletName: string
│       └── outletAddress: string
├── businesses/
│   └── {businessId}/
│       └── outlets/
│           └── {outletId}/
│               ├── orders/{orderId}/...
│               ├── dishes/{dishId}/...
│               ├── categories/{categoryId}/...
│               ├── customers/{phone}/...
│               ├── settings/Store/{fields}
│               └── settings/Delivery/{fields}
└── riders/
    └── {riderId}/
        ├── name, phone, email, vehicle
        ├── status: "Online"|"On Delivery"|"Offline"
        ├── location: { lat, lng }
        ├── earnings, deliveries, rating
        └── ...
```

## Access Patterns

### Admin access (App.jsx)
- After auth, reads `admins/{uid}` to obtain `businessId` + `outletId`
- All subsequent reads/writes go through `Outlet(path)`:
  ```
  ref(db, `businesses/${_bizId}/outlets/${_outletId}/${path}`)
  ```
- Admin reads `riders/{riderId}` for assignment + live tracking

### Rider access
- Riders write their own location/status to `riders/{riderId}`
- Riders may read orders assigned to them

### Bot access
- Bot service account reads `orders/` for status monitoring
- Bot writes order status updates, sends notifications

## Security Rule Requirements

Based on access patterns, rules should enforce:

1. **`/admins/{uid}`** — Read: only the authenticated admin whose uid matches; Write: only during initial setup (admin creation)
2. **`/businesses/{businessId}/outlets/{outletId}/**` — Read/Write: only admins whose `admins/{uid}` profile matches the `businessId`/`outletId`; this can be validated via `root/admins/{auth.uid}/businessId` and `root/admins/{auth.uid}/outletId`
3. **`/riders/{riderId}`** — Read: authenticated users (admins, riders); Write: only the rider themselves (`auth.uid === riderId`) for location/status updates
4. **`/orders/{orderId}`** — Write: bot service account via custom claims; Read: admin + assigned rider

## Current Rule Weaknesses

- The App.jsx uses `ref(db, "riders")` without outlet scoping — riders are a top-level shared resource
- Orders, dishes, categories, customers, settings are all scoped under the outlet path
- No validation rules exist for order status transitions (sequential flow enforced only client-side)
- No stock decrement atomicity validation (POS decrements stock after order — race condition possible)
- No validation that only admins with matching `businessId`/`outletId` can access specific outlet data

## Recommended Rules Structure

```json
{
  "rules": {
    "admins": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid && !data.exists()",
        ".validate": "newData.hasChildren(['businessId', 'outletId'])"
      }
    },
    "businesses": {
      "$businessId": {
        "$outletId": {
          ".read": "root.child('admins/'+auth.uid+'/businessId').val() === $businessId && root.child('admins/'+auth.uid+'/outletId').val() === $outletId",
          ".write": "root.child('admins/'+auth.uid+'/businessId').val() === $businessId && root.child('admins/'+auth.uid+'/outletId').val() === $outletId"
        }
      }
    },
    "riders": {
      "$riderId": {
        ".read": "auth.uid === $riderId || root.child('admins').hasChild(auth.uid)",
        ".write": "auth.uid === $riderId"
      }
    }
  }
}
```

## Data Validation Rules Needed

### Orders
- `status` must be one of: Placed, Confirmed, Preparing, Cooked, Ready, Out for Delivery, Reached Drop Location, Delivered, Cancelled
- `total` must be numeric and >= 0
- `cart` must be an array with items having `name`, `qty`, `price`
- `createdAt` should be a timestamp

### Dishes
- `name` must be non-empty string
- `price` must be numeric >= 0
- `stock` must be numeric >= 0
- `category` should reference an existing category ID

### Categories
- `name` must be non-empty string

### Settings/Store
- `lat` must be between -90 and 90
- `lng` must be between -180 and 180
- `gstin` should match GSTIN pattern if present

## Firebase Storage

- Bucket: `food-hubbie.firebasestorage.app`
- Images uploaded via `uploadImage(file, path)` in `firebase.js`
- Images deleted via `deleteImage(url)` (silently catches errors)
- Used by Menu page for dish images
- Storage rules should restrict uploads to authenticated admins only
