# Active View — Decisions

## Design Decisions
1. **4-step progress bar** — Visual progress with active/completed states; gives rider clear sense of journey stage
2. **Slide-to-action buttons** — Prevents accidental taps; enforces intentional action (similar to iPhone slide-to-unlock)
3. **Proximity gating per step** — Each action requires GPS proximity; prevents fraud/premature status updates
4. **30s countdown on ping** — Urgency without pressure; auto-skip on timeout
5. **Google Maps integration** — Opens native maps app for turn-by-turn navigation (not embedded)
6. **OTP rate limiting** — 10 attempts then 60s block; prevents brute-force but allows recovery
7. **Admin OTP bypass** — Rider can call admin for manual override if OTP issues persist
8. **Map placeholder** — Real map would require Google Maps API key; currently shows static map placeholder with loading indicator
9. **Confetti on success** — Post-delivery celebration animation improves rider satisfaction
10. **Cash/UPI toggle** — Simple payment method selection without complex payment integration
