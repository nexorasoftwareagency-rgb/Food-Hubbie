# Active View — Important Points

1. **Proximity gates vary by step**: 1km (outlet) → 300m (pickup) → dropRadius (customer, from outlet settings)
2. **Slide action**: Uses `touchstart/touchmove/touchend` events with CSS `translateX` for drag effect
3. **OTP regenerates**: 60s cooldown between regenerates; uses same 4-digit Math.floor(1000 + Math.random() * 9000)
4. **onDisconnect safety**: Rider status set to "offline" if connection drops mid-trip
5. **Confetti overlay**: `#successCelebration` with CSS keyframe particles, auto-dismiss after 4s
6. **Navigate button**: Opens `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` for native app
7. **Multiple active orders**: Possible if rider has 2+ orders; view shows list of active orders with tabs
8. **Audio feedback**: Slide completion plays success chime; OTP failure plays error beep
9. **Payment options**: Only Cash and UPI; no card or wallet integration yet
10. **Version enforcement**: If app version changes mid-trip, shows "Update Required" with nuclear refresh
