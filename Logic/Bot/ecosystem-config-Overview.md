# Bot — ecosystem.config.js Overview

## Purpose
PM2 ecosystem configuration for running multiple bot instances (one per outlet) on EC2.

## Structure
```js
module.exports = {
  apps: [
    {
      name: "foodhubbie-bot-roshani-pizza",
      script: "index.js",
      cwd: __dirname,
      env: {
        BUSINESS_ID: "business_roshani",
        OUTLET_ID: "outlet_pizza",
        FIREBASE_DATABASE_URL: "https://food-hubbie-default-rtdb.firebaseio.com",
        BOT_LABEL: "Roshani Pizza Bot"
      },
      watch: false,
      max_memory_restart: "300M"
    },
    {
      name: "foodhubbie-bot-roshani-cake",
      script: "index.js",
      cwd: __dirname,
      env: {
        BUSINESS_ID: "business_roshani",
        OUTLET_ID: "outlet_cake",
        ...
      },
      watch: false,
      max_memory_restart: "300M"
    }
  ]
};
```

## Instance Config Per Outlet
| Field | Value |
|---|---|
| `watch` | `false` — no auto-restart on file changes |
| `max_memory_restart` | `300M` — restart if process exceeds 300MB |
| `cwd` | Bot directory root |

## Points
- Adding a new outlet = add another entry to `apps[]`
- No `instances` (cluster mode) — each outlet is its own OS process
- All instances share the same `index.js` — behavior differs via env vars
- No health check or auto-restart on crash (PM2 default behavior, not explicit)
