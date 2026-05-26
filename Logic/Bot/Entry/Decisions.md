# Bot Entry (index.js) — Decisions

| Decision | Rationale |
|---|---|
| **Silent Pino logger** (`level: 'silent'`) | Reduces log noise from Baileys internal traces |
| **Session per outlet** (`sessions/{bid}_{oid}`) | Multi-tenant isolation; each EC2 instance has its own WhatsApp session |
| **`fetchLatestBaileysVersion`** | Ensures compatibility with WhatsApp servers without hardcoding version |
| **Browser ID `['Foodhubbie SaaS', 'Chrome', '1.0.0']`** | Identifies the bot uniquely on WhatsApp's device list |
| **Reconnect on close (unless logged out)** | Automatic recovery from network drops; logged out = manual re-auth needed |
| **Heartbeat every 60s** | Lightweight — avoids excessive writes while providing liveness monitoring |
| **Process error handlers keep bot alive** | Prevents crash on edge cases; better to limp than die |
| **Single entry point for all outlets** | Same `index.js` serves both Pizza and Cake bots via env vars |
