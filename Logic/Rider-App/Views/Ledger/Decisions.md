# Ledger View — Decisions

## Design Decisions
1. **Wallet hero at top** — Large balance display gives rider immediate financial snapshot
2. **Cash to settle separate** — Distinguishes between platform-tracked earnings and physical cash held by rider
3. **Settlement history** — Modal overlay (not separate view) keeps ledger clean
4. **Daily earning summary** — Quick "today" stat without filtering transactions manually
5. **Transaction list** — Chronological list with type icons for quick scanning
6. **No real-time updates on completed view** — Manual refresh via pull-to-refresh
7. **Settlement request via button** — Creates a settlement record in Firebase for admin processing
8. **Read-only+** — Rider reads own data, only writes settlement requests
