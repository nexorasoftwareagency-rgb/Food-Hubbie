# Bot Entry (index.js) — Database Structure

## `botStatus`
| Field | Type | Example | Description |
|---|---|---|---|
| `lastSeen` | number (epoch ms) | `1748191200000` | Last heartbeat timestamp |
| `status` | string | `"Online"` | Always "Online" when running |
| `businessId` | string | `"business_roshani"` | Tenant identifier |
| `outletId` | string | `"outlet_pizza"` | Outlet identifier |

### Example
```json
{
  "botStatus": {
    "lastSeen": 1748191200000,
    "status": "Online",
    "businessId": "business_roshani",
    "outletId": "outlet_pizza"
  }
}
```
