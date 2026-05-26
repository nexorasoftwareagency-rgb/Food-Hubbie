# Earnings View — Code Logics

## Purpose
Detailed earnings breakdown with today's summary, weekly chart, and per-shop breakdown.

## Key Functions (app.js)
| Function | Trigger | Action |
|---|---|---|
| `window.showEarnings()` | View init | Load and render earnings data |
| `window.filterEarningsByPeriod(period)` | Tab tap | Switch between Today/Week/Month |
| `window.renderWeeklyChart(data)` | Data ready | Draw weekly earnings bar chart |
| `window.showShopBreakdown()` | Button | Expand per-outlet earnings |

## Sections
```
Earnings View:
├─ Today's Earnings Hero (large ₹ amount)
├─ Cash to Settle
├─ Weekly Chart (bar chart, CSS-based)
├─ Period Tabs: Today | This Week | This Month
└─ Shop Breakdown: Per-outlet earnings list
```

## Data Source
- `riders/{uid}/ledger` — All completed deliveries
- `riders/{uid}/wallet` — Balance/total earned

## Calculations
- **Period earnings**: Sum of `amount` where entry timestamp falls in period
- **Cash to settle**: Sum of `cashCollected` where method was Cash AND not settled
- **Weekly chart**: Group ledger entries by day (last 7 days), sum earnings per day
- **Shop breakdown**: Group by `outletId`, sum earnings, sort by highest

## Chart Rendering
```
Weekly bar chart (pure CSS, no library):
  ├─ 7 bars (Mon-Sun or last 7 days)
  ├─ Bar height proportional to daily earnings
  ├─ Max-height bar = highest earning day (100%)
  ├─ Label below: day name
  └─ Value on top: ₹ amount
```

## Edge Cases
- **First day riding** → No data for previous days, chart shows single bar
- **No earnings this week** → Chart shows 0 state
- **Single shop all week** → Shop breakdown shows one entry
- **Empty period** → "No earnings in this period" message
