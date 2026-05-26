# Settings Tab — Important Points

1. **2FA secret in RTDB**: TOTP secret stored in Firebase Realtime Database — not ideal security practice (server-side storage preferred)
2. **QRCode.js dependency**: CDN-loaded library — if unavailable, manual secret entry is fallback
3. **OTPAuth library**: Client-side TOTP verification — verifies code without server round-trip
4. **data-retention run-time**: Processing large datasets could take seconds — UI shows spinner
5. **Archival structure**: `archives/{type}/{bid}/{oid}/{year}/{month}/{id}` — organized by time for easy cleanup
6. **No audit for retention actions**: `applyDataRetention()` does NOT log to audit (may want to add)
7. **Retention not persisted**: Admin's chosen retention periods are NOT saved — re-selected each visit
8. **Telemetry is static**: System info display is hardcoded text, not actual live telemetry
9. **Plaintext password known issue**: Mentioned in telemetry display but no action to fix
