# Bot — create-admin.js Overview

## Purpose
One-time script to create or verify a Firebase Auth user for the admin dashboard and write corresponding entries to the Realtime Database.

## Flow
1. Initializes Firebase Admin SDK with `service-account.json`
2. Checks if user exists at `roshanipizza@gmail.com` via `auth.getUserByEmail()`
3. If not found → creates user via `auth.createUser()` with password `989515`
4. Writes admin entry to **two** RTDB paths:
   - `system/admins/{uid}` — system-level admin registry
   - `admins/{uid}` — legacy/flat admin registry
5. Verifies slug: `slugs/outlets/roshani-pizza` → `{ businessId, outletId }`

## Admin Entry Schema
| Field | Value |
|---|---|
| `email` | `"roshanipizza@gmail.com"` |
| `password` | `"989515"` |
| `businessId` | `"business_roshani"` |
| `outlet` | `"outlet_pizza"` |
| `role` | `"business"` |
| `phone` | `""` |

## Points
- Password hardcoded — security risk if committed
- Writes to two paths (`system/admins/` + `admins/`) for backward compatibility
- Script exits after completion (`process.exit(0)`)
- Only handles `business_roshani`/`outlet_pizza` — not generalized
