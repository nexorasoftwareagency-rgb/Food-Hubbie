# Ledger View — Code Logics

## Purpose
Wallet and transaction history showing earnings, balance, cash to settle, and pending settlements.

## Key Functions (app.js)
| Function | Trigger | Action |
|---|---|---|
| `window.showLedger()` | View init | Load wallet + transaction history |
| `window.showSettlementHistory()` | Button | Open #settlementModal |
| `window.requestSettlement(amount)` | Button | Create settlement request |

## Sections
```
Ledger View:
├─ Wallet Hero: Balance (₹X,XXX)
├─ Today's Earning: ₹XXX
├─ Cash to Settle: ₹XXX (pending settlement amount)
├─ Quick Actions: [Settlement History]
└─ Transaction List: Recent entries + "View All"
```

## Data Sources
- `riders/{uid}/wallet` — Balance + total earned
- `riders/{uid}/ledger` — Individual transaction entries
- `settlements/{uid}` — Settlement records

## Calculations
- **Today's Earning**: Sum of ledger entries where timestamp is today
- **Cash to Settle**: Sum of completed deliveries where paymentMethod was Cash (not yet settled)
- **Balance**: wallet.balance (system-tracked)
- **Settlement**: Request amount withdrawn from cash to settle

## Edge Cases
- **No transactions** → "No transactions yet" empty state
- **Negative balance** → Show in red with warning (shouldn't happen normally)
- **Zero cash to settle** → Hide settlement section
- **Pending settlement** → Show "Settlement in progress" with timestamp
