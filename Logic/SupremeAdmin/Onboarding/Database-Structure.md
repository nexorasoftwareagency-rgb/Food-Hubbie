# Onboarding — Database Structure

## Paths Used
| Path | Read/Write | Purpose |
|------|-----------|---------|
| /onboarding_requests/{id} | Read/Delete | Pending requests |
| /businesses/{bid} | Write | Create business |
| /businesses/{bid}/outlets/{oid} | Write | Create outlet |
| /system/admins/{adminId} | Write | Admin mapping |

## Data Shapes

### Onboarding Request
```json
{
  "onboarding_requests": {
    "{id}": {
      "businessName": "Business Name",
      "ownerName": "Owner Name",
      "email": "owner@email.com",
      "phone": "9876543210",
      "address": "Business Address",
      "outletName": "Main Outlet",
      "timestamp": 1717000000000,
      "createdAt": 1717000000000
    }
  }
}
```

### Created Business
```json
{
  "businesses": {
    "biz_1717000000000": {
      "name": "Business Name",
      "ownerName": "Owner Name",
      "email": "owner@email.com",
      "phone": "9876543210",
      "address": "Business Address",
      "slug": "business-slug",
      "lat": 0,
      "lng": 0,
      "createdAt": 1717000000000,
      "outlets": {
        "outlet_1717000000000": {
          "name": "Main Outlet",
          "address": "Business Address",
          "phone": "9876543210",
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
      "admin_1717000000000_abc": {
        "email": "admin@email.com",
        "businessId": "biz_1717000000000",
        "outletId": "outlet_1717000000000",
        "role": "supreme"
      }
    }
  }
}
```

## ID Generation Pattern
- businessId: `biz_{Date.now()}`
- outletId: `outlet_{Date.now()}`
- adminId: `admin_{Date.now()}_{random}`
- These are NOT Firebase push keys — they're timestamp-based strings
