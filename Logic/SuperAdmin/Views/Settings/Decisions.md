# Settings Tab — Decisions

## Design Decisions
1. **2FA via TOTP** — Industry standard, authenticator app compatibility (Google Auth, Authy)
2. **QR code + manual secret** — Both scan and manual entry supported for all authenticator apps
3. **Data retention with archive/purge choice** — Archive preserves data in separate path, purge removes permanently
4. **Per-type retention periods** — Different defaults for orders (90d), audit (90d), settlements (180d)
5. **Retention status indicator** — Animated spinner during processing, success toast on completion
6. **Static telemetry display** — System info shown as styled terminal output (not real-time)
7. **Client-side OTPAuth** — TOTP verification done entirely in browser; no server required
