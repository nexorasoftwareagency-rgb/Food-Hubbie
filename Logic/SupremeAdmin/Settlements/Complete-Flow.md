# Settlements — Complete Flow

## User Journey
1. Admin clicks Settlements tab → initSettlements() fires
2. Loads all orders from all businesses/outlets
3. Computes settlement data per order (amount, commission, net amount)
4. Table renders with: Order ID, Business, Outlet, Amount, Commission, Net, Status, Date
5. Admin can:
   a. **Filter by date**: Set from/to dates → orders filtered client-side
   b. **Filter by status**: Select pending/settled/all → orders filtered
   c. **Settle**: Click "Settle" on an unsettled order:
      - settleOrder() pushes settlement record
      - Pushes audit log
      - Success toast

## Settlement Calculation Flow
Order total (₹250) →
  Commission (15%): ₹37.50 →
  Fixed Fee: ₹10 →
  Net Amount: ₹250 - ₹37.50 - ₹10 = ₹202.50

## Audit Trail
settleOrder() → /system/auditLogs/{push}:
  {action: "Order Settled", details: "...", admin: "...", timestamp: now}
