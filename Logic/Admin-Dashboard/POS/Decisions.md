# POS — Design Decisions

## Cart as Object (Not Array)
- Keyed by composite key: `{dishId}::{size}::{sortedAddonKeys}`
- Triple-colon delimiter avoids collision with dish IDs containing single colon
- O(1) lookup for merging duplicate items

## Stock Validation via Single Bulk Read
- Calls `get(Outlet("dishes"))` once before checkout
- Validates all cart items against fresh stock data
- Avoids N individual reads per cart item
- **Caveat**: small window for overselling between validation and decrement

## Order Status: "Confirmed" (Not "Placed")
- Counter sales skip the "Placed → Confirmed" step
- Admin is both accepting and confirming the order simultaneously

## Order ID Format: YYYYMMDD-NNNN
- Outlet-scoped sequence read from `metadata/orderSequence`
- Date prefix enables chronological sorting without a dedicated timestamp index

## Receipt as data:text/html in New Window
- No backend receipt generation needed
- Browser print dialog handles formatting
- `onload="window.print()"` triggers print automatically
- **No** `window.close()` — user must manually close the tab

## `addToCartRef` useRef Pattern
- Prevents keyboard event handler from being re-attached on every render
- Ensures `Enter` key always calls the latest `addToCart` reference

## Discount as Percentage Input, Stored as Amount
- Percentage entry is user-friendly (0–100)
- Stored value is computed amount for audit trail

## Phone Validation Optional
- Blank phone allowed for walk-in customers
- If filled: strip non-digits, must be exactly 10 digits

## `editKey` State for Cart Editing
- Tracks which cart entry is being edited
- Avoids mutating cart object directly
- On save: removes old entry, adds new entry with updated config
