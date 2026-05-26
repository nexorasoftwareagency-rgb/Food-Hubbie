# Audit Tab — Code Logics

## Purpose
Unified security audit console — aggregated telemetry from all system sources.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadAuditLogs()` | Tab load | Aggregate logs from 4 sources |
| `renderUnifiedLogs(logs, filter)` | Data ready | Paginated audit table |

## Data Sources (4)
| Path | Source | Description |
|---|---|---|
| `system/auditLogs` | Admin portals | SuperAdmin + Admin Dashboard actions |
| `logs/marketplaceAudit` | Marketplace | Customer actions |
| `logs/botAudit` | WhatsApp Bot | Bot activities |
| `logs/riderErrors` | Rider App | Rider app errors |

## Filter
| Value | Path Included |
|---|---|
| `all` | All 4 sources |
| `admin` | `system/auditLogs` |
| `marketplace` | `logs/marketplaceAudit` |
| `whatsapp` | `logs/botAudit` |
| `rider` | `logs/riderErrors` |

## Unified Table Columns
| Column | Source |
|---|---|
| Source | Badge indicating which system |
| Entity | Admin ID / User ID / Rider ID |
| Event / Action | Action name |
| Metadata | Action details (truncated) |
| Timestamp | Event time |

## Pagination
- Page size: 20 logs per page
- PAGINATION.audit tracks page state
- renderPagination() for controls

## Edge Cases
- **No logs** → "No audit logs found" empty state
- **Filter with no matches** → "No matching log entries"
- **Large dataset** → Pagination prevents DOM overload
- **Missing log source** → Firebase path may not exist (e.g., no bot logs yet) → caught silently
