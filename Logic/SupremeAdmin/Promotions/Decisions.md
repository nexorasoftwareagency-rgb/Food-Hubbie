# Promotions — Decisions

1. **Three separate RTDB paths for promotions**: Surge, discount, and platform fee stored independently under /system. Makes them independently manageable but requires 3 separate reads.

2. **Coupons as sub-collection**: Stored under /system/promotions/coupons as a separate node. Allows independent real-time listener.

3. **Global discount and platform fee handlers NOT IMPLEMENTED**: Buttons exist in HTML but never wired. Suggests these were planned but development stopped.

4. **Real-time coupon listener**: loadCoupons() uses on('value') so coupon table updates automatically. Good for multi-admin scenarios.

5. **Coupon active toggle**: Inline toggle rather than separate edit/save flow. Simple UX for enabling/disabling coupons.

6. **Pause All button**: Iterates all coupons and sets active=false. No "Resume All" counterpart.

7. **Surge time range**: Uses simple time strings (HH:MM). No timezone handling — assumes server/orders use IST.
