# WhatsApp Engine (whatsapp-engine.js) — Points

## Edge Cases
- **User sends location without text** — `location` object present, `text` empty → handled via `m.message?.locationMessage`
- **User sends text without location** — `text` present, `location` null → handled per step
- **Shop closed** → session's `activeOutlet` reset, user returned to start
- **No categories/dishes** → "No menu items" message, session reset to START
- **Out of stock dish selected** → "Sold Out" message, re-prompt
- **Invalid menu number** (out of range, non-numeric) → "Invalid selection" message
- **Quantity > 50** → rejected (upper bound)
- **Phone < 10 digits** → re-prompt
- **Message > 1000 chars** → rejected early
- **Rate limit / spam** — no rate limiting implemented; user can spam freely
- **Location for discovery vs delivery** — same location field used; discovery location is overwritten by delivery location

## Gotchas
- Session cache TTL is 30 min but periodic cleanup runs every 10 min — stale entries can persist up to 10 min past expiry
- `globalSlabs` fallback path is `system/settings/delivery/slabs` — must exist or defaults used
- Cart items include `outletId` but multi-outlet cart is not supported (all items must be from same outlet)
- Order ID (`FH-{ts}-{rand}`) is NOT the same format as admin dashboard orders (`YYYYMMDD-NNNN`) — two parallel order ID systems
- No `orderSequence` metadata written — admin dashboard's auto-ID system not used
- No discount/tax calculation — subtotal = sum of cart totals, total = subtotal + deliveryFee
- `sendImage()` catches errors and falls back to text-only — but error is silently caught, image failure unknown to user
- `profile.address` may be null — reused profile with incomplete data

## Future Improvements
- Add addon selection flow (currently empty array always)
- Add online payment integration (Razorpay/Stripe)
- Support multi-outlet cart in discovery mode
- Add rate limiting (max N messages per minute)
- Use admin dashboard order ID format for consistency
- Add discount + tax calculation
- Add order editing before checkout
- Integrate OTP generation at checkout
- Add language/localization support
- Add delivery time slot selection
