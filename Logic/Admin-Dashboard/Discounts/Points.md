# Points / Gotchas: Admin Discounts Module

## UI
- **Tab counts update live** — `onValue` listener recalculates active/scheduled/expired on every snapshot
- **Modal grid is single-column on mobile** — `mobile-overrides.css` handles responsive
- **Type badge colors** — 🌐 Global (blue), 🏷️ Category (orange), ✨ New Customer (purple), 🟟 Coupon (green)

## POS Integration
- **Manual override wins** — cashier's ₹ discount always overrides auto-discount
- **"Effective discount" indicator** — recalculates on every cart change
- **discountSource pill** — shows in orders table so staff can explain to confused customers

## Performance
- **30s cache** — same as bot-side. Cleared after CRUD operations.
- **`onValue` listener** — detach on tab switch to stay under 50K Spark reads/day

## Edge Cases
- **Draft discount** — `enabled: false` makes it invisible to evaluator
- **Expiring soon** — no automatic banner yet (deferred to v5.1.6)
- **Concurrent edits** — eventual consistency; `updatedAt` field for optimistic locking

## Related docs
- `Logic/Bot/Discount-Engine/Points.md` — bot-side gotchas
- `Logic/Admin-Dashboard/Discounts/Code-Logics.md` — full implementation
