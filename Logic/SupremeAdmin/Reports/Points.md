# Reports — Points

## Key Implementation Details
- All metrics computed from scratch on each tab visit
- Revenue chart is all-time (unlike Dashboard's 14-day window)
- html2pdf.js for PDF generation
- CSV export from rendered DOM

## Fixed Bugs
1. ~~**MEDIUM**: dailyRevenueTrendChart canvas exists but no JS writes to it (orphaned)~~ **FIXED** (removed)
2. ~~**LOW**: Extra closing `</div>` at line 414 closes reportsContent early~~ **FIXED**
3. **LOW**: No date range filter — all orders from all time included
4. **LOW**: Top 10 outlets only — no way to see beyond top 10
5. **LOW**: PDF export captures whatever is in DOM — extra elements may be included

## Gotchas
- Computation time increases with order volume (no pagination or limit)
- No caching — re-computes every visit
- CSV export only captures visible page content
- Take rate may be misleading if many free/zero-value orders exist
- Duplicate chart canvas (dailyRevenueTrendChart) may confuse future developers
- Extra `</div>` causes layout issues for PDF export
- No breakdown by time period (daily, weekly, monthly)
- No comparison with previous periods (MoM, YoY growth)
