# Code-Logics: AnalyticsPage

**Location**: App.jsx lines 2201-2347

## Props
- `{ showToast }`

## State
- `period` — `"week"` | `"month"` | `"quarter"` (cosmetic only, does not change data)

## Computed Values
- `totalRev` — sum of `WEEK_DATA.rev`
- `totalOrd` — sum of `WEEK_DATA.ord`
- `prevRev` — sum of `PREV_WEEK_DATA.rev`
- `prevOrd` — sum of `PREV_WEEK_DATA.ord`
- `revTrend` — `((totalRev - prevRev) / prevRev) * 100`
- `ordTrend` — `((totalOrd - prevOrd) / prevOrd) * 100`
- `avgValue` — `totalRev / totalOrd`
- `avgTrend` — similar trend calc for avg value
- `bestDay` — day with max `WEEK_DATA.rev`

## Renders
- **4 KPICards**: Revenue (with trend arrow), Orders (with trend), Avg Order Value (with trend), Best Day
- **Revenue vs Orders bar chart** — dual dataset with previous week overlay
- **Vs Last Week comparison widget** — rev/ord change percentages
- **Sales by Category pie chart** — `CAT_DATA` with `PIE_COLORS`
- **Orders by Hour area chart** — `HOURLY_DATA`
- **Rider Performance bars** — mock rider earnings from `MOCK_RIDERS`
