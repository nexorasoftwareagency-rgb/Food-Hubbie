# Code-Logics: SettlementsPage

**Location**: App.jsx lines 2397-2449

## Props
- `{ showToast }`

## State
- None — pure mock data from `MOCK_TRANSACTIONS` constant

## Computed Values
- `total` — sum of all amounts
- `credits` — sum of positive amounts
- `debits` — sum of negative amounts (absolute value)

## Renders
- **3 KPICards**: Net Balance, Total Credits, Total Debits
- **Export buttons**: CSV / PDF (both call `downloadCSV` — PDF is mislabeled)
- **Table**: Transaction ID, Date, Type, Amount (green for positive, red for negative), Method, Status badge
- **Amount colors**: positive = `"#22c55e"` (green), negative = `"#ef4444"` (red)
- **Status badge colors**: settled = green, pending = orange
