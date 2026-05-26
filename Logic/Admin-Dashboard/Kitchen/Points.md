# KitchenPage Key Points

## `advanceAll()` Error Handling
- Uses sequential `await` inside a `for...of` loop
- If one update fails, subsequent ones still execute due to `.catch(() => {})`
- Silent error swallowing — no toast on failure

## Timer Drift
- `setInterval` re-created every time `kitchenOrders` changes (dependency in `useEffect`)
- Timer counter can drift/reset if orders update frequently
- Each order update in Firebase triggers `onValue` → `setKitchenOrders` → new interval

## Timer Reset on Reference Change
- `statusTimers` initializes new keys with `prev[k] | 0` (bitwise OR coerces `undefined` to 0)
- Composite key `{id}+{status}` means advancing to new status = fresh timer
- But if `kitchenOrders` array reference changes (every `onValue`), all timers reset

## Cancel Button
- Always shown regardless of order stage
- No restriction beyond `window.confirm`
- Cancelling an order in "Cooked" or "Ready" stage has no special guard

## Item Line Total Field
- Detail modal uses `item.lineTotal || item.total || item.price`
- Field name inconsistency across order sources
- POS orders may use different field names than manual/bot orders

## Empty States
- Context-aware messages:
  - `"No orders match your search"` — filter/search active but no results
  - `"Kitchen is clear!"` — truly empty kitchen
