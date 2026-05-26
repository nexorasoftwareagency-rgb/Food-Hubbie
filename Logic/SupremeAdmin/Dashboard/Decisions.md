# Dashboard — Decisions

1. **Real-time listener on /businesses (entire node)**: Chose to listen on the entire businesses node rather than individual sub-paths. This makes the dashboard always up-to-date but costs bandwidth as the entire businesses tree is downloaded on every change.

2. **6 KPIs computed client-side**: All metrics (businesses count, outlets, orders today, revenue today, users, riders) are computed from raw data in JavaScript. No server-side aggregation or pre-computed counters.

3. **Data sharing via globals (usersData, ridersData)**: Dashboard reads user/rider counts from global variables set by other tabs' listeners (initUsers, initRiders). This creates an implicit dependency on those tabs being initialized.

4. **Chart.js for visualization**: Chose Chart.js 4.4.7 over alternatives like D3.js or ApexCharts. Chart.js is simpler for common chart types and has good CDN availability.

5. **14-day revenue window**: Revenue chart shows last 14 days. This provides a reasonable balance between showing trends and not overwhelming the chart.

6. **Doughnut for order status**: Doughnut chart chosen over pie or bar for order status distribution. More visually appealing and shows proportions effectively.

7. **No loading state**: Dashboard renders immediately with whatever data is available. No spinner or skeleton screen between Firebase fetch and render.

8. **No error handling**: Failed Firebase reads silently fail (listener simply doesn't fire). No retry logic or user-facing error messages.
