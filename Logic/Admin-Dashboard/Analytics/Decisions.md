# Decisions: AnalyticsPage

## Why mock data
Pure mock data demonstrates chart library capabilities without backend dependency.

## Design choices
- **Period selector (week/month/quarter) is cosmetic** — all periods show the same mock data
- **Trend indicators** computed as percentage change between `WEEK_DATA` and `PREV_WEEK_DATA`
- **4 chart types** (Area, Bar, Pie, Bar) — showcases recharts library
- **Dual dataset bar chart** — current vs previous week overlay for comparison
