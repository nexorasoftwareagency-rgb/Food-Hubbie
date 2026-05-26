# Businesses — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid} | Read/Write | Business record |
| /businesses/{bid}/outlets/{oid} | Read/Write | Outlet details |
| /businesses/{bid}/commission | Read/Write | Commission config |
| /system/admins/{adminId} | Read | Admin email lookup |

## Data Shapes

### Business
```json
{
  "businesses": {
    "biz_1717000000000": {
      "name": "Business Name",
      "ownerName": "Owner",
      "email": "owner@email.com",
      "phone": "9876543210",
      "address": "Address",
      "slug": "business-slug",
      "lat": 28.6139,
      "lng": 77.2090,
      "createdAt": 1717000000000,
      "commission": {
        "percent": 15,
        "fixedFee": 10
      },
      "outlets": {
        "outlet_1717000000000": {
          "name": "Outlet Name",
          "address": "Outlet Address",
          "phone": "9876543210",
          "lat": 28.6139,
          "lng": 77.2090,
          "createdAt": 1717000000000
        }
      }
    }
  }
}
```

### Admin Mapping
```json
{
  "system": {
    "admins": {
      "admin_1717000000000": {
        "email": "admin@email.com",
        "businessId": "biz_1717000000000",
        "outletId": "outlet_1717000000000"
      }
    }
  }
}
```

## Key Fields
- commission.percent: Number (0-100, platform's cut)
- commission.fixedFee: Number (₹, per-order fixed platform fee)
- outlets.{oid} can have multiple entries per business (1-to-many)
