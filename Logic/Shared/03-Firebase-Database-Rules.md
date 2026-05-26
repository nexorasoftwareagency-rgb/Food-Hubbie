# Shared — Firebase Database Rules

## Overview

The Firebase Realtime Database uses a multi-tenant structure enforced by `.read`/`.write` rules based on authentication and path patterns.

---

## Rule File

Located at `D:\Foodhubbie\database.rules.json`

## Key Rule Patterns

### Admin Access

```json
"admins": {
  ".read": "auth.uid !== null",
  ".write": "auth.uid !== null"
}
```

Authenticated admin users can read/write the `admins` node. The admin UID is checked against the node key.

### Global Nodes (Read-Only for Authenticated)

```json
"platformConfig": {
  ".read": "auth.uid !== null",
  ".write": false
}
```

### Business Scoping

```json
"businesses": {
  "$businessId": {
    ".read": "auth.uid !== null",
    ".write": "auth.uid !== null",
    "outlets": {
      "$outletId": {
        ".read": "auth.uid !== null",
        ".write": "auth.uid !== null"
      }
    }
  }
}
```

All outlet-scoped data (orders, dishes, categories, etc.) lives under:
```
businesses/{businessId}/outlets/{outletId}/
```

### Rider Access

```json
"riders": {
  "$riderId": {
    ".read": "auth.uid === $riderId || root.child('admins/'+auth.uid).exists()",
    ".write": "auth.uid === $riderId"
  }
}
```

Riders can only read/write their own node. Admins can read all riders.

### Orders — Validation

```json
"orders": {
  "$orderId": {
    ".validate": "newData.hasChildren(['orderId', 'status', 'createdAt'])"
  }
}
```

Orders must have at minimum: `orderId`, `status`, `createdAt`.

---

## Path Access Matrix

| Path Pattern | Read | Write | Who |
|---|---|---|---|
| `admins/{uid}` | auth.uid !== null | auth.uid !== null | Admins |
| `businesses/{biz}/outlets/{outlet}/*` | auth.uid !== null | auth.uid !== null | Admins |
| `riders/{riderId}` | Self + Admins | Self only | Riders |
| `platformConfig` | auth.uid !== null | false (read-only) | Everyone authenticated |
| `bot/{biz}/{outlet}/*` | auth.uid !== null | auth.uid !== null | Bot service account |
| `logs/*` | auth.uid !== null | auth.uid !== null | System |
| `superAdmin/*` | auth.uid !== null | auth.uid !== null | Super admins |

---

## Indexes

Defined in `database.rules.json` under `.indexOn`:

| Path | Index On |
|---|---|
| `businesses/{biz}/outlets/{outlet}/orders` | `status` (for filtering by order status) |
| `businesses/{biz}/outlets/{outlet}/orders` | `createdAt` (for sorting by date) |
| `businesses/{biz}/outlets/{outlet}/orders` | `phone` (for customer lookup) |
| `businesses/{biz}/outlets/{outlet}/orders` | `riderId` (for rider assignment lookup) |
| `riders` | `status` (for filtering online/busy riders) |

---

## Security Rules Structure (Full Reference)

```
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "admins": { ... },
    "businesses": {
      "$businessId": {
        "outlets": {
          "$outletId": {
            "orders": { "$orderId": { ".validate": "..." } },
            "dishes": { "$dishId": { ... } },
            "categories": { "$catId": { ... } },
            "metadata": { "$key": { ... } },
            "inventory": { ... },
            "botUsers": { ... }
          }
        }
      }
    },
    "riders": { "$riderId": { ... } },
    "riderStats": { "$riderId": { ... } },
    "bot": { "$businessId": { "$outletId": { ... } } },
    "platformConfig": { ... },
    "superAdmin": { ... },
    "logs": { ... }
  }
}
```
