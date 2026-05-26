# Delivery Tab — Decisions

## Design Decisions
1. **Two mutually exclusive modes** — Per-100m for simple pricing, Slabs for zone-based pricing
2. **Inline-editable slab table** — Remove/add rows without opening modals or navigating away
3. **Global setting** — Applied to all businesses/outlets; no per-outlet override
4. **Preserved data on mode switch** — Switching between modes keeps the other mode's configuration in memory
5. **Deploy Changes button** — Explicit save prevents accidental changes; no auto-save
6. **Example text helper** — Shows pricing example for clarity (e.g., "₹2 per 100m = ₹20/km")
