# Reconciliation Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `once('value')` | Load all businesses/outlets/settlements |
| `businesses/{bid}/outlets/{oid}/settlements/{id}` | Read, Write | Settlement CRUD |
| `businesses/{bid}/outlets/{oid}/wallet` | Transaction | Payout wallet update |
| `businesses/{bid}/outlets/{oid}/ledger/{txId}` | Push | Ledger entry |

## Settlement Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "settlements": {
            "$id": {
              ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
            }
          },
          "wallet": {
            ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
          },
          "ledger": {
            "$txId": {
              ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
            }
          }
        }
      }
    }
  }
}
```

## Notes
- Settlements write restricted to superadmin/admin only
- Business and outlet roles cannot process settlements
- Wallet transaction ensures safe concurrent access
