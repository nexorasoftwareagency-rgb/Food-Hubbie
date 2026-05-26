# Profile Page — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `users/{userId}` | Full profile, wallet, addresses |
| `users/{userId}/wallet/history` | Transaction history |

## Paths Written
| Path | Purpose |
|---|---|
| `users/{userId}` | Profile updates (name, phone) |
| `users/{userId}/wallet` | Cashback credits, manual top-up |

## Rules
- `users/{userId}` — `.read` = `auth.uid === userId`, `.write` = `auth.uid === userId`
- Wallet history is append-only via walletService
