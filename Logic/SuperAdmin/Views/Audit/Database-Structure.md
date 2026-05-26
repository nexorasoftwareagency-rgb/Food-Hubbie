# Audit Tab — Database Structure

## Admin Audit Log
`system/auditLogs/{logId}`
| Field | Type | Description |
|---|---|---|
| `timestamp` | number | Event time |
| `adminId` | string | Admin UID |
| `adminEmail` | string | Admin email |
| `action` | string | Action name |
| `details` | object | Action-specific data |

## Marketplace Audit
`logs/marketplaceAudit/{logId}`
| Field | Type | Description |
|---|---|---|
| `timestamp` | number | Event time |
| `userId` | string | Customer UID |
| `action` | string | Action name |
| `details` | object | Action data |

## Bot Audit
`logs/botAudit/{logId}`
| Field | Type | Description |
|---|---|---|
| `timestamp` | number | Event time |
| `action` | string | Bot action |
| `details` | object | Action data |

## Rider Errors
`logs/riderErrors/{logId}`
| Field | Type | Description |
|---|---|---|
| `timestamp` | number | Error time |
| `riderId` | string | Rider UID |
| `error` | string | Error message |
| `stack` | string | Stack trace |
