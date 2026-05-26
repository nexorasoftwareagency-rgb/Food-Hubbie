# Onboarding Tab — Database Structure

## Onboarding Request
`onboarding_requests/{uid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Partner name |
| `email` | string | Partner email |
| `phone` | string | Partner phone |
| `businessName` | string | Business name |
| `businessSlug` | string | Business ID (slug) |
| `outletName` | string | First outlet name |
| `outletSlug` | string | Outlet ID |
| `address` | string | Outlet address |
| `lat` | number | Outlet latitude |
| `lng` | number | Outlet longitude |
| `status` | string | `pending`, `approved`, `rejected` |
| `submittedAt` | number | Timestamp |

## Onboarding History
`onboarding_history/{uid}`
Same structure as request + `approvedAt` + `approvedBy`

## Default Categories
`businesses/{bid}/outlets/{oid}/categories`
| Category | Items |
|---|---|
| `starter` | Default starter items |
| `main` | Default main course items |
| `beverages` | Default beverage items |

## Created Records
| Path | Source of Data |
|---|---|
| `businesses/{bid}` | `name`, `bid`, `commission=10`, `isActive=true` |
| `businesses/{bid}/outlets/{oid}` | `address`, `lat`, `lng`, `slug`, `email`, `phone` |
| `system/admins/{uid}` | `email`, `role=business`, `name`, `phone`, `password` |
| `slugs/outlets/{slug}` | `{ bid, oid }` |
