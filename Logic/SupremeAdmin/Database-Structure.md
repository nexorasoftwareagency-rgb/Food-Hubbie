# SupremeAdmin — Database Structure

## RTDB Schema (Firebase Realtime Database)

All data operations use the Realtime Database. Firestore is imported but never used.

### /businesses
Business records keyed by business ID.
```
{
  "{bid}": {
    "name": "Business Name",
    "ownerName": "Owner Name",
    "email": "owner@email.com",
    "phone": "9876543210",
    "address": "Business Address",
    "slug": "business-slug",
    "lat": 28.6139,
    "lng": 77.2090,
    "createdAt": 1717000000000,
    "commission": {
      "percent": 15,
      "fixedFee": 10
    },
    "outlets": {
      "{oid}": {
        "name": "Outlet Name",
        "address": "Outlet Address",
        "phone": "9876543210",
        "lat": 28.6139,
        "lng": 77.2090,
        "adminEmail": "admin@example.com",
        "createdAt": 1717000000000,
        "orders": {
          "{orderId}": {
            "orderId": "FH-1717000000000-ABC",
            "customerName": "Customer Name",
            "customerPhone": "9876543210",
            "businessName": "Business Name",
            "outletName": "Outlet Name",
            "items": [
              {"name": "Item", "qty": 2, "price": 100}
            ],
            "total": 200,
            "status": "pending",
            "timestamp": 1717000000000,
            "type": "delivery",
            "address": "Delivery Address"
          }
        },
        "menu": {
          "{dishId}": {
            "name": "Dish Name",
            "price": 150,
            "category": "Main Course",
            "stock": 50,
            "available": true,
            "image": "",
            "description": "Dish description"
          }
        },
        "reviews": {
          "{revId}": {
            "userId": "user_uid",
            "userName": "User Name",
            "rating": 4,
            "comment": "Great food!",
            "timestamp": 1717000000000
          }
        },
        "settlements": {
          "{sId}": {
            "orderId": "FH-...",
            "amount": 200,
            "commission": 30,
            "netAmount": 170,
            "status": "settled",
            "settledAt": 1717000000000
          }
        }
      }
    }
  }
}
```

### /riders
```
{
  "{uid}": {
    "name": "Rider Name",
    "email": "rider@email.com",
    "phone": "9876543210",
    "fatherName": "Father's Name",
    "age": 25,
    "aadharNo": "1234-5678-9012",
    "qualification": "12th Pass",
    "address": "Rider Address",
    "status": "active",
    "createdAt": 1717000000000
  }
}
```

### /users
```
{
  "{uid}": {
    "name": "User Name",
    "email": "user@email.com",
    "phone": "9876543210",
    "wallet": 500,
    "walletHistory": {
      "{key}": {
        "amount": 100,
        "type": "credit",
        "reason": "Admin credit",
        "timestamp": 1717000000000
      }
    }
  }
}
```

### /onboarding_requests
```
{
  "{id}": {
    "businessName": "New Business",
    "ownerName": "Owner",
    "email": "owner@email.com",
    "phone": "9876543210",
    "address": "Address",
    "outletName": "New Outlet",
    "timestamp": 1717000000000
  }
}
```

### /system
```
{
  "admins": {
    "{uid}": {
      "email": "admin@email.com",
      "businessId": "bid",
      "outletId": "oid",
      "role": "supreme",
      "tfaSecret": "BASE32SECRET"
    }
  },
  "promotions": {
    "surge": {
      "enabled": true,
      "multiplier": 1.5,
      "startTime": "18:00",
      "endTime": "22:00",
      "threshold": 50
    },
    "globalDiscount": {
      "active": true,
      "type": "percentage",
      "value": 10
    },
    "coupons": {
      "{cid}": {
        "code": "SAVE20",
        "type": "percentage",
        "value": 20,
        "minOrder": 100,
        "usageLimit": 100,
        "active": true
      }
    }
  },
  "config": {
    "platformFee": {
      "type": "fixed",
      "value": 5
    }
  },
  "settings": {
    "delivery": {
      "slabs": [
        {"minDistance": 0, "maxDistance": 2, "fee": 20},
        {"minDistance": 2, "maxDistance": 5, "fee": 35}
      ]
    }
  },
  "broadcasts": {
    "{key}": {
      "title": "Broadcast Title",
      "message": "Broadcast message",
      "audience": "all",
      "timestamp": 1717000000000
    }
  },
  "auditLogs": {
    "{key}": {
      "action": "Business Created",
      "details": "Created business XYZ",
      "admin": "admin@email.com",
      "timestamp": 1717000000000,
      "type": "business"
    }
  }
}
```

### /logs
```
{
  "marketplaceAudit": { "{key}": { ... } },
  "botAudit": { "{key}": { ... } },
  "riderErrors": { "{key}": { ... } }
}
```

### /archives
```
{
  "orders": { "{bid}": { "{oid}": { "{orderId}": { ... } } } },
  "audit": { "{path}": { "{key}": { ... } } },
  "settlements": { "{bid}": { "{oid}": { "{sId}": { ... } } } }
}
```

## Key Observations
- Orders are nested under business > outlet (deep nesting)
- Delivery slabs stored as array (not object) — unusual for RTDB
- Wallet balance stored as top-level number on user (not nested)
- Audit logs split across 4 separate paths
- Archives mirror production paths under /archives/ namespace
