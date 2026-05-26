# Settlements — Code Logics

## Initialization
- initSettlements() reads all orders from all businesses/outlets
- Computes settlement data: order amount, commission, net amount

## Data Computation
1. Iterates /businesses/{bid}/outlets/{oid}/orders
2. For each order: computes estimated commission based on business commission config
3. Groups by order status (only unsettled orders shown by default)
4. Flattens to settlement rows

## Filters
- Date range: from/to date inputs (client-side filter)
- Status filter: dropdown (all/pending/settled)
- btnFilterSettlements exists in HTML but has **no click handler** — filtering uses change events on inputs

## Settle Action
- settleOrder(bid, oid, orderId, netAmount):
  1. Pushes settlement record to /businesses/{bid}/outlets/{oid}/settlements/
  2. Pushes audit log entry to /system/auditLogs
  3. Updates order status reference (optional)
  4. Shows success toast

## CSV Export
- exportSettlementsCSV():
  - Reads rendered table DOM
  - Generates CSV with BOM
  - Triggers download

## Settlement Record Shape
```json
{
  "orderId": "FH-...",
  "amount": 250,
  "commission": 37.5,
  "commissionPercent": 15,
  "fixedFee": 10,
  "netAmount": 202.5,
  "status": "settled",
  "settledAt": 1717000000000
}
```
