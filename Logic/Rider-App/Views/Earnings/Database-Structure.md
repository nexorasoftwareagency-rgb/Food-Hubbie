# Earnings View — Database Structure

## Primary Source: Ledger
Same as Ledger view — `riders/{uid}/ledger/{txId}`

## Computed Structures (client-side)

### Weekly Chart Data
```
{
  days: [
    { dayName: "Mon", earnings: 450, deliveries: 3 },
    { dayName: "Tue", earnings: 320, deliveries: 2 },
    ...
  ]
}
```

### Shop Breakdown
```
{
  shops: [
    { outletId: "outlet1", outletName: "Shop A", earnings: 1250, deliveries: 5 },
    { outletId: "outlet2", outletName: "Shop B", earnings: 800, deliveries: 3 }
  ]
}
```

### Period Earnings
| Period | Filter |
|---|---|
| Today | timestamp >= start of today (IST) |
| This Week | timestamp >= start of current week (Monday) |
| This Month | timestamp >= start of current month |
