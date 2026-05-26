# Riders Tab — Database Structure

## Rider
`riders/{uid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Rider full name |
| `phone` | string | 10-digit mobile |
| `email` | string | Auth email |
| `password` | string | Auth password (set during creation) |
| `role` | string | `"rider"` |
| `status` | string | `online`, `offline`, `busy` |
| `isActive` | boolean | Account status |
| `vehicle` | string | Bike/Car/Walk |
| `address` | string | Rider address |
| `photoURL` | string | Profile image (Storage URL) |
| `aadharImage` | string | Aadhar image URL |
| `wallet/balance` | number | Wallet balance |
| `wallet/totalEarned` | number | Lifetime earnings |
| `createdAt` | number | Account creation |

## Storage Paths
- `riders/{uid}/profile.jpg` — Compressed profile photo
- `riders/{uid}/aadhar.jpg` — Compressed aadhar image
