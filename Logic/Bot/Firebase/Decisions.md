# Bot Firebase (firebase.js) — Decisions

| Decision | Rationale |
|---|---|
| **`service-account.json` with fallback** | EC2 uses SA for full access; local dev works with application default creds |
| **`outletOverride` parameter on every wrapper** | Global Discovery mode needs to read/write multiple outlets from same bot instance |
| **`getGlobalData` as separate method** | Clearly separates tenant-scoped vs system-wide data access |
| **Config from `config/` package, overridable via env** | Environment-specific config (dev vs production DB URLs) without code changes |
| **Admin SDK (not client SDK)** | Server-side initialization with full read/write access; no security rules to manage |
| **`createFirebaseOps` factory re-use** | Shares path resolution and caching logic with admin dashboard (single source of truth) |
