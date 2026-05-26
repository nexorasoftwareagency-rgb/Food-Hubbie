# Settings Tab — Database Structure

## 2FA Config
`system/admins/{uid}/tfa`
| Field | Type | Description |
|---|---|---|
| `enabled` | boolean | 2FA active |
| `secret` | string | TOTP secret (base32) |

## Archive Entry (Orders)
`archives/orders/{bid}/{oid}/{year}/{month}/{orderId}`
Full order object + `_archivedAt` timestamp.

## Archive Entry (Audit Logs)
`archives/auditLogs/{year}/{month}/{logId}`
Full audit entry + `_archivedAt`.

## Archive Entry (Marketplace Audit)
`archives/marketplaceAudit/{year}/{month}/{logId}`
Full marketplace audit entry + `_archivedAt`.

## Archive Entry (Bot Audit)
`archives/botAudit/{year}/{month}/{logId}`
Full bot audit entry + `_archivedAt`.

## Archive Entry (Settlements)
`archives/settlements/{year}/{month}/{settlementId}`
Full settlement entry + `_archivedAt`.

## Retention Config (UI only, not persisted to Firebase)
| Setting | Field ID | Options |
|---|---|---|
| Orders Period | `#retentionOrders` | 30, 60, 90, 180, 365 days |
| Orders Action | `#retentionOrdersAction` | archive, purge |
| Audit Period | `#retentionAudit` | 30, 60, 90, 180 days |
| Audit Action | `#retentionAuditAction` | archive, purge |
| Settlements Period | `#retentionSettlements` | 60, 90, 180, 365 days |
| Settlements Action | `#retentionSettlementsAction` | archive, purge |

## TOTP Secret (OTPAuth)
- Algorithm: SHA1
- Digits: 6
- Period: 30 seconds
- Issuer: "Foodhubbie Pro"
