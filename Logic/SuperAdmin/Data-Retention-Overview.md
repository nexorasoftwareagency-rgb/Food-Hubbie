# SuperAdmin — Data Retention Policies

## Overview
Configurable data retention system for managing old data — archive or purge orders, audit logs, and settlements.

## Three Policy Types

### 1. Orders Retention
| Config | Options |
|---|---|
| Period | 30 / 60 / 90 / 180 / 365 days |
| Action | Archive or Purge |

**Process** (`processRetentionOrders()`):
```
For each business → outlet:
  Query orders where createdAt < cutoff date
  For each eligible order:
    If archive: write to archives/orders/{bid}/{oid}/{year}/{month}/{orderId}
    If purge: skip archive step
    Remove from businesses/{bid}/outlets/{oid}/orders/{orderId}
```

### 2. Audit Logs Retention
| Config | Options |
|---|---|
| Period | 30 / 60 / 90 / 180 days |
| Action | Archive or Purge |

**Process** (`processRetentionAudit()`):
```
For each audit source (system/auditLogs, logs/marketplaceAudit, logs/botAudit):
  Query entries where timestamp < cutoff date
  For each eligible entry:
    If archive: write to archives/auditLogs/{year}/{month}/{id}
    If purge: skip archive step
    Remove from source path
```

### 3. Settlements Retention
| Config | Options |
|---|---|
| Period | 60 / 90 / 180 / 365 days |
| Action | Archive or Purge |

**Process** (`processRetentionSettlements()`):
```
For each business → outlet:
  Query settlements where status === "SETTLED" AND timestamp < cutoff date
  For each eligible settlement:
    If archive: write to archives/settlements/{year}/{month}/{id}
    If purge: skip archive step
    Remove from source
```

## Archive Structure
```
archives/
├── orders/{bid}/{oid}/{year}/{month}/{orderId}
├── auditLogs/{year}/{month}/{logId}
├── marketplaceAudit/{year}/{month}/{logId}
├── botAudit/{year}/{month}/{logId}
└── settlements/{year}/{month}/{settlementId}
```
Each archived entry includes original data + `_archivedAt` timestamp.

## UI Controls
Located in Infrastructure tab:
- Select dropdown for retention period
- Select dropdown for action (archive/purge)
- "Apply Policy" button per type
- Animated spinner during processing
- Status text showing progress

## Edge Cases
- **No old data** → Toast "No data to retain"
- **Very large dataset** → May take several seconds; UI shows spinner
- **Archive path collision** → Overwrites (acceptable)
- **Partial failure** → Some items may be removed but not archived (no transactional guarantee)
- **No audit logging** → Retention actions are NOT logged to audit trail
