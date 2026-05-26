# Points / Gotchas: LostSalesPage

- **No Firebase integration** — `MOCK_LOST` constant defined in App.jsx
- **No filtering, searching, or date range** — static view of 5 mock entries
- **No remediation actions** — cannot re-contact customer or re-order items
- **Cancelled count = entries where reason includes "cancel"** — case-insensitive string matching, fragile
- **avgLoss = totalLoss / total entries** — simple average, not weighted
