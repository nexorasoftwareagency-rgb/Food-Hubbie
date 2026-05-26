# Reports — Decisions

1. **All orders read for computation**: Reports recompute metrics from scratch each time by reading all orders. No pre-computed aggregates or cached statistics.

2. **All-time revenue chart**: Unlike Dashboard (14-day window), reports chart shows all-time daily revenue. This may be overwhelming for long-running platforms.

3. **Top 10 outlets only**: Shows only the top 10 outlets by revenue. No way to view beyond top 10 or sort by other metrics.

4. **html2pdf.js for PDF**: Uses external library for PDF generation. Captures HTML content as-is. Quality depends on CSS print styles.

5. **CSV from DOM**: Both CSV and PDF exports read from rendered DOM rather than raw data. Limits export to what's visually displayed.

6. **Manual computation every view**: No caching of computed metrics. Every time admin visits Reports tab, all orders are re-read and re-computed.

7. **Duplicate chart canvas**: dailyRevenueTrendChart canvas exists in HTML but is never used. Likely leftover from copy-paste from Dashboard.
