# Settlements — Decisions

1. **Computed from all orders**: Settlement data is computed on-the-fly from the orders tree rather than stored in a separate settlements table. This means settlement amounts are always based on current order data.

2. **Per-order settlement**: Each order is settled individually. No bulk settlement or batch processing.

3. **Commission uses business-level config**: Commission is read from /businesses/{bid}/commission (percent + fixedFee). No per-outlet commission support.

4. **Settlement creates separate record**: When settled, a record is pushed to /businesses/{bid}/outlets/{oid}/settlements/. This creates an immutable audit trail separate from the order.

5. **Client-side filtering**: Date range and status filters are applied client-side. All orders must be loaded before filtering.

6. **No scheduling/auto-settlement**: Settlements are manual — admin must click "Settle" for each order.
