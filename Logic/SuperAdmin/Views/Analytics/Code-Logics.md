# Analytics Tab — Code Logics

## Purpose
Platform-wide growth analytics — revenue, order trends, and performance indicators.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadReports()` (shared) | Tab load | Aggregates data across businesses/outlets — same function used by Reports tab |

## Data Sources
Reuses the same aggregation pipeline as the Reports tab:
- `businesses/{bid}/outlets/{oid}/orders` — Order data
- `businesses/{bid}` — Business metadata

## KPI Cards
| ID | Metric |
|---|---|
| `#analyticsTotalRevenue` | Sum of all order totals |
| Additional cards | Growth %, Avg Order Value, Total Orders |

## Implementation
- Analytics tab calls `loadReports()` which aggregates across the entire ecosystem
- Data rendered into KPI cards and optional chart

## Note
The Analytics tab is a simplified, read-only version of the Reports tab — focused on top-level KPIs without export functionality or detailed leaderboards.
