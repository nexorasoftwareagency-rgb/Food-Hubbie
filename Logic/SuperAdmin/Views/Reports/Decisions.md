# Reports Tab — Decisions

## Design Decisions
1. **Chart.js for revenue chart** — Lightweight charting library without heavy framework dependency
2. **14-day revenue trend** — Sufficient window for weekly comparisons without excessive data
3. **Multi-format export** — CSV for data, PDF for formatted reports, Excel for spreadsheet users
4. **html2pdf for PDF** — Client-side PDF generation from HTML, no server required
5. **Outlet leaderboard** — Identify top and bottom performing partners
6. **Chart instance cleanup** — `revenueChartInstance.destroy()` prevents memory leaks on re-render
7. **Shared loadReports() with Analytics tab** — Single aggregation function, different rendering
