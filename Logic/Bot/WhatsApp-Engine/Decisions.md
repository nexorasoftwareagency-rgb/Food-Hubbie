# WhatsApp Engine (whatsapp-engine.js) — Decisions

| Decision | Rationale |
|---|---|
| **Global Discovery mode** (OUTLET_ID=GLOBAL) | Single bot instance can serve multiple outlets; users discover nearby shops |
| **Session cache with 30-min TTL** | Reduces Firebase reads; auto-cleanup prevents memory leaks |
| **Session persisted to Firebase** | Survives bot restart; user can resume order |
| **No addon selection flow** | Simplified UX — addons stored empty; shown as future improvement |
| **Cash on Delivery only** | Simplified payment for WhatsApp orders; no online payment integration needed |
| **Order ID: `FH-{timestamp}-{random4}`** | Unique without sequence counter; no race condition on Firebase |
| **Location required** | Necessary for delivery fee calculation and rider dispatch |
| **10km discovery radius** | Balanced range for food delivery; covers urban service areas |
| **`reset`/`menu` text resets session** | Quick escape for users who get stuck in the flow |
| **Session JID key sanitized** (`.` → `,`) | Firebase keys cannot contain dots |
| **Delivery fee from outlet slabs, fallback to global** | Outlet-specific pricing with system-wide defaults |
| **Shop hours check** (`isShopOpen`) | Prevents order placement when shop is closed |
| **Cart tracks `outletId` per item** | Future-proof for multi-outlet cart (currently all items same outlet) |
