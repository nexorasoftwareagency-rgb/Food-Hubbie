# Code-Logics: LostSalesPage

**Location**: App.jsx lines 2352-2392

## Props
- `{ showToast }`

## State
- None — pure mock data from `MOCK_LOST` constant

## Computed Values
- `totalLoss` — sum of all `MOCK_LOST.total` values
- `cancelledCount` — count of entries where reason includes "cancel" (case-insensitive)
- `avgLoss` — `totalLoss / MOCK_LOST.length`

## Renders
- **3 KPICards**: Total Loss, Cancelled Orders count, Avg Loss per Order
- **Table**: Order ID, Customer, Reason, Time, Loss amount
