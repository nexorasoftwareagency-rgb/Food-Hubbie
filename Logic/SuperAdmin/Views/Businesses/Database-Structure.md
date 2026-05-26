# Businesses Tab — Database Structure

## Business
`businesses/{bid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Business name |
| `bid` | string | Business ID |
| `commission` | number | Commission % |
| `fixedCommission` | number | Fixed fee |
| `phone` | string | Contact |
| `address` | string | Address |
| `isActive` | boolean | Status |
| `createdAt` | number | Created |

## Admin (for email lookup)
`system/admins/{uid}`
| Field | Used For |
|---|---|
| `email` | Display in Admin Authority column |
| `role` | Filter: only `business` role |
