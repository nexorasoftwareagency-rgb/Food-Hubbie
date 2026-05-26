# Rider App — Firebase Rules

## Authentication
- Email/password auth with rider convention: `{phone}@rider.com`
- Rider UID stored in `riders/{uid}` profile
- Firebase Auth (not custom claims) for access control

## Database Paths & Access

### Rider Profile (owner — `riders/{uid}`)
| Path | Access |
|---|---|
| `riders/{uid}` | Rider read/write |
| `riders/{uid}/location` | Rider write, admin read |
| `riders/{uid}/wallet` | Rider read, system write |
| `riders/{uid}/ledger/{txId}` | Rider read, system write |
| `riders/{uid}/notifications/{id}` | Rider read/write |
| `riders/{uid}/fcmToken` | Rider write |
| `riderStats/{riderId}` | Rider read, system write |

### Orders (admin + assigned rider)
| Path | Access |
|---|---|
| `businesses/{b}/outlets/{o}/orders` | Rider read (unassigned), Rider write (assigned) |
| `businesses/{b}/outlets/{o}/orders/{id}/status` | Rider write (if assigned) |
| `businesses/{b}/outlets/{o}/orders/{id}/assignedRider` | Rider write (via transaction) |
| `businesses/{b}/outlets/{o}/orders/{id}/deliveryOTP` | Rider read |
| `businesses/{b}/outlets/{o}/otpAttempts/{orderId}` | Rider write (rate-limited) |

### System (admin only)
| Path | Access |
|---|---|
| `businesses/{b}/outlets/{o}/settings/Delivery` | Rider read |
| `businesses/{b}/outlets/{o}/settings/Store` | Rider read |
| `businesses/{b}/outlets/{o}/botCommands` | Rider write (WhatsApp messages) |
| `logs/riderErrors/{riderId}` | Rider write |
| `settlements/{uid}` | Rider read |

## Key Rule Requirements
- Order assignment: `runTransaction` ensures no double-assignment
- OTP attempts: Write validation on `otpAttempts` — max 10 per order, 60s cooldown
- Status updates: Rider can only update orders where `assignedRider === auth.uid`
- Location: Rider writes own location; no other rider can write
