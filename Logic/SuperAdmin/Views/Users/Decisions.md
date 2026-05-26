# Users Tab — Decisions

## Design Decisions
1. **Wallet credit via transaction** — `transaction()` on walletBalance ensures atomicity
2. **Wallet history tracking** — Every credit recorded with reason for audit trail
3. **Password reset via Firebase Auth** — Uses built-in `sendPasswordResetEmail()` instead of manual password change
4. **Client-side search** — Filter loaded users by name/email/phone without additional Firebase queries
5. **CSV export** — For offline auditing and external systems
6. **Last active display** — Shows user engagement recency
7. **Pagination** — Standard pagination for large user bases
