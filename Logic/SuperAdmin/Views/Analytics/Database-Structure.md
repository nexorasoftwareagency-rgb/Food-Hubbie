# Analytics Tab — Database Structure

## Aggregated Metrics (client-side)
| Metric | Computation |
|---|---|
| Total Revenue | Sum of `order.totalAmount` across all orders |
| Total Orders | Count of all orders |
| Avg Order Value | Total Revenue / Total Orders |
| Growth % | (This period - Last period) / Last period × 100 |

## Note
Analytics tab does NOT use any additional database paths beyond what `loadReports()` already reads. All metrics computed client-side from the orders dataset.
