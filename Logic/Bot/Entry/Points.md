# Bot Entry (index.js) — Points

## Edge Cases
- **Session directory created eagerly** — even if auth fails, empty `sessions/` dir is created
- **QR collision** — if previous session exists, `useMultiFileAuthState` auto-loads it; QR only shown if no valid creds
- **Reconnect loop** — if `DisconnectReason` is something other than loggedOut but auth is stale, bot loops reconnect indefinitely

## Gotchas
- `fetchLatestBaileysVersion` can fail if WhatsApp servers are unreachable — no fallback version
- Heartbeat continues writing even if Firebase is temporarily down (Promise rejection caught silently)
- No health check endpoint — bot status only observable via Firebase `botStatus` node

## Future Improvements
- Add graceful shutdown (SIGTERM handler to mark bot offline)
- Add reconnect backoff (exponential delay to avoid rapid reconnect loops)
- Add health check HTTP endpoint for monitoring
- Support multiple Baileys versions as fallback
