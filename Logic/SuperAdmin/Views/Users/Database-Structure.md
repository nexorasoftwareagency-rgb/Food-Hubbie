# Users Tab — Database Structure

## User
`users/{uid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Customer name |
| `email` | string | Email address |
| `phone` | string | Phone number |
| `walletBalance` | number | Current wallet balance |
| `createdAt` | number | Account creation time |
| `lastSeen` | number | Last login/activity |

## Wallet History Entry
`users/{uid}/walletHistory/{txId}`
| Field | Type | Description |
|---|---|---|
| `amount` | number | +/- amount |
| `reason` | string | Admin-provided reason |
| `timestamp` | number | Transaction time |
| `adminId` | string | Processing admin UID |
