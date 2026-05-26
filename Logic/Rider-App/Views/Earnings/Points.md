# Earnings View — Important Points

1. **No external charting lib** — Pure CSS flexbox bars with `height` set dynamically via JS `style.height`
2. **Bar height calculation**: `(dayEarnings / maxEarnings) * 100` as percentage
3. **Weekly chart default**: Shows last 7 complete days (not current partial week)
4. **Shop breakdown sorting**: Descending by earnings (highest earner first)
5. **Cash to settle red badge**: If > ₹0, shows prominent red badge
6. **Currency format**: All amounts through `window.formatCurrency()` with ₹ prefix
7. **Comma separators**: Uses `toLocaleString('en-IN')` for Indian number format
8. **Hidden overflow**: Weekly chart container has `overflow-x: auto` for small screens
9. **Animation**: Bars animate from 0 to full height on load (CSS transition)
10. **Same data as Ledger**: Reuses ledger entries; no additional Firebase reads beyond what Ledger already accessed
