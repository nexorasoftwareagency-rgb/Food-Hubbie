# Businesses — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /businesses | Read (listener) | All business data |
| /businesses/{bid} | Write (commission, outlet) | Commission update, outlet edit |
| /businesses/{bid}/commission | Write | Commission percentage + fixed fee |
| /businesses/{bid}/outlets/{oid} | Write | Outlet details (name, address, phone, lat, lng) |
| /system/admins | Read | Admin email mapping |

## Security Considerations
- /businesses/{bid}/commission is writeable by any authenticated admin
- Outlet details are directly editable — no approval workflow for changes
- /system/admins exposes email-to-business mapping broadly

## Suggested Rules
```json
{
  "businesses": {
    "$bid": {
      ".read": "auth != null",
      ".write": "auth != null",
      "commission": {
        ".validate": "newData.hasChildren(['percent', 'fixedFee'])"
      },
      "outlets": {
        "$oid": {
          ".validate": "newData.hasChildren(['name', 'address', 'phone'])"
        }
      }
    }
  }
}
```
