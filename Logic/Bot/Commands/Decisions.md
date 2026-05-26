# Bot Commands (commands.js) — Decisions

| Decision | Rationale |
|---|---|
| **Firebase-driven commands** (not WhatsApp commands) | Admin Dashboard can write commands without needing to know bot's phone number |
| **Auto-delete after processing** | Prevents re-execution on bot restart; keeps `botCommands` path clean |
| **IST timezone adjustment** | Admin expects reports in Indian timezone regardless of server location |
| **Top 5 items only** | WhatsApp message length limit; keeps report readable on mobile |
| **`reportPhone` from store settings** | Avoids hardcoding admin number per outlet |
