# Bot — Multi-Tenant Consolidation

> **Status:** Active (architecture freeze)  
> **Audience:** Architects, senior developers  
> **Last updated:** 2026-06-04  
> **Format:** Code-Logics · Firebase-Rules · Database-Structure · Connecting-Nodes · Complete-Flows  
> **See also:** `docs/02-bot/02-Multi-Tenant-Bot-Engine.md` (canonical engine doc) · `docs/bot-operations.md` (runbook) · `docs/00-master/00-ARCHITECTURE.md` (C4 model)
> **Scope:** Replaces the "one PM2 process per outlet" model with a
> single multi-socket process driven by a tenant registry in Firebase.

This is the design freeze for PRs 13–16. No code changes ship until
this doc is agreed.

---

## 1. Why

### Current state (what PR 5 left us with)

The bot today runs as **three separate PM2 processes**, each pinned to
exactly one outlet via environment variables:

| PM2 process | Env var | Tenant |
|---|---|---|
| `foodhubbie-bot-roshani-pizza` | `FOODHUBBIE_BIZ_ID=business_roshani`, `FOODHUBBIE_OUTLET_ID=outlet_pizza` | Roshani Pizza |
| `foodhubbie-bot-roshani-cake` | `FOODHUBBIE_BIZ_ID=business_roshani`, `FOODHUBBIE_OUTLET_ID=outlet_cake` | Roshani Cakes |
| `foodhubbie-bot-prashant-pizza` | `FOODHUBBIE_BIZ_ID=business_prashant`, `FOODHUBBIE_OUTLET_ID=pizza-parsa` | Prashant Pizza |

To add a fourth outlet you must: (a) write a new PM2 entry, (b) deploy
new code, (c) restart PM2, (d) have the operator scan a QR code. Every
tenant change is a deploy.

### Pain points

1. **Operations scale linearly with tenants.** A 20-outlet business
   needs 20 PM2 entries, 20 QR scans, 20 env-var configs.
2. **`BUSINESS_ID/OUTLET_ID` are module-level constants** in
   `bot/firebase.js` and `bot/whatsapp-engine.js`. The engine can
   never represent "this user is mid-conversation with outlet A, but
   the bot is configured for outlet B" without a code change.
3. **`outletOverride` parameter is dead code** — every helper in
   `firebase.js` accepts it (lines 107–133) but **no caller ever
   passes it**. An earlier attempt at multi-tenancy was abandoned.
4. **Per-tenant outage isolation is poor.** A crash in one bot
   process takes down one tenant. The other two keep running — fine —
   but the operator's mental model is "three bots", not "one
   dispatcher with three connections."
5. **Cross-tenant features are impossible.** Want to send a "Roshani
   Group" promo to all Roshani outlets? Today you have to script three
   different env-var contexts.

---

## 2. Target state

A **single PM2 process** that, at boot:

1. Reads a tenant registry from `system/bot_routing/` in Firebase.
2. Creates **one Baileys socket per enabled entry**, each in its own
   session directory.
3. Wires a **tenant-scoped engine** to each socket via a closure.
4. Runs a per-tenant heartbeat (already tenant-scoped in the data
   path — no change needed).
5. Reconnects individual sockets on disconnect without restarting the
   others.

Adding a new outlet becomes: `node scripts/seed-bot-routing.js
--phone=919876543212 --biz=business_newgroup --outlet=outlet_main`,
then restart the bot, then scan one QR code.

### What does *not* change

- **Firebase data model** under `businesses/<bid>/outlets/<oid>/...` —
  every existing read/write is already tenant-scoped. The bot was
  always writing to the right path; it just didn't know how to route
  multiple tenants inside one process.
- **The state machine** in `whatsapp-engine.js` (the 20+ handlers
  for `START`, `DISCOVERY_LOCATION`, `CATEGORY_SELECTION`, etc.) — the
  refactor moves them inside a factory function but the logic is
  unchanged.
- **The `user.activeBid` / `user.activeOutlet` per-user override** at
  `whatsapp-engine.js:599` — preserved. This is the right escape
  hatch for "this customer is mid-flow, route to a different outlet."

---

## 3. Data model

### `system/bot_routing/`

A flat map of `whatsappPhoneNumber → tenantDescriptor`:

```json
{
  "system": {
    "bot_routing": {
      "919876543210": {
        "businessId": "business_roshani",
        "outletId": "outlet_pizza",
        "label": "Roshani Pizza Bot",
        "enabled": true,
        "createdAt": "2026-06-01T12:00:00Z"
      },
      "919876543211": {
        "businessId": "business_roshani",
        "outletId": "outlet_cake",
        "label": "Roshani Cake Bot",
        "enabled": true,
        "createdAt": "2026-06-01T12:00:00Z"
      },
      "919876543212": {
        "businessId": "business_prashant",
        "outletId": "pizza-parsa",
        "label": "Prashant Pizza Bot",
        "enabled": true,
        "createdAt": "2026-06-01T12:00:00Z"
      }
    }
  }
}
```

**Key invariants:**

- **Phone number key** is the WhatsApp Business number's full
  international format **without the `+`**, e.g. `919876543210`. This
  matches what Baileys reports in `sock.user.id` after the socket
  authenticates.
- **At most one tenant per phone number.** Enforced by the seed
  script — if you re-register, the script upserts (overwrites the
  existing entry).
- **`enabled: false`** entries are skipped at boot. Use this to
  temporarily pause a tenant without losing the registration.
- **No `businessId` change is allowed in place.** If an outlet is
  re-assigned to a different business, delete the old key first
  (or rotate the phone number).

### `system/botSessions/` (unchanged)

Already tenant-scoped at `system/botSessions/<bid>/<oid>/<safeJid>`.
No schema change.

### `businesses/<bid>/outlets/<oid>/botStatus/` (unchanged)

The heartbeat path the orchestrator writes to. Already
tenant-scoped.

---

## 4. Architecture

### Component diagram

```
┌──────────────────────────────────────────────────────────────┐
│  PM2: foodhubbie-bot (one process)                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  bot/multi-tenant.js  (orchestrator)                   │  │
│  │                                                        │  │
│  │  • reads system/bot_routing/ once at boot              │  │
│  │  • for each enabled entry:                             │  │
│  │      ┌─────────────────────────────────────────────┐   │  │
│  │      │  SessionDir: bot/sessions/<bid>_<oid>/      │   │  │
│  │      │  Socket:     makeWASocket(...)               │   │  │
│  │      │  Engine:     createEngine({bid, oid, label})  │   │  │
│  │      │  Handlers:   sock.ev.on('messages.upsert',   │   │  │
│  │      │                engine.handleIncomingMessage)  │   │  │
│  │      │  Heartbeat:  setInterval → botStatus          │   │  │
│  │      │  Reconnect:  on close → reconnect this socket │   │  │
│  │      └─────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  shared services: initCommandListener, initStatusMon   │  │
│  │  (one per tenant socket)                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### `createEngine(tenant)` factory

`whatsapp-engine.js` today is a module of free functions that all
read `BUSINESS_ID/OUTLET_ID` from `firebase.js`. PR 14 turns it into:

```js
function createEngine(tenant) {
  const { businessId, outletId, label } = tenant;

  // Each handler closes over the tenant.
  async function handleIncomingMessage(sock, m) { /* ... */ }
  async function handleStart(sock, jid, user) { /* ... */ }
  // ... 20+ handlers, unchanged in logic

  return { handleIncomingMessage, handleStart, /* ... */ };
}
```

`firebase.js` similarly stops exporting `BUSINESS_ID/OUTLET_ID` as
constants. It exports a `tenantContext({businessId, outletId})`
factory that returns **scoped helper closures** — `getData`, `setData`,
etc., each bound to that tenant. This kills the unused `outletOverride`
parameter for good.

### Session state

The in-memory `sessionCache` (currently `Map<jid, session>`) becomes
`Map<tenantKey, Map<jid, session>>` where `tenantKey = ${bid}_${oid}`.
The persisted path stays as-is.

A **safer alternative** considered: drop the in-memory cache entirely
and rely on the Firebase read in `getSession()`. Rejected because the
60s heartbeat + 20-tenant scale could push the read load too high.
Keeping the cache with a tenant-scope key is the right tradeoff.

### Logging

Every log line gets a tenant prefix: `[roshani-pizza]` `[roshani-cake]`.
Pino's `child()` is the cleanest way to wire this — each engine
instance gets `const log = rootLogger.child({ tenant: label })`.

---

## 5. Cutover strategy

The cutover is **one tenant at a time**, not a big-bang. This is
because each WhatsApp number can be linked to exactly one socket at a
time — you cannot run "old PM2 process" and "new unified process"
against the same phone number simultaneously.

### Per-tenant cutover runbook

1. **Pick a tenant** to migrate first (start with the lowest-volume
   outlet, e.g. Prashant Pizza).
2. **Stop its old PM2 process**: `pm2 stop foodhubbie-bot-prashant-pizza`.
3. **Register it** in the new registry:
   ```bash
   node scripts/seed-bot-routing.js \
     --phone=919876543212 \
     --biz=business_prashant \
     --outlet=pizza-parsa \
     --label="Prashant Pizza Bot"
   ```
4. **Deploy the new code** with the orchestrator. Start it.
5. **Scan the QR code** for that phone number. The orchestrator logs
   `[prashant-pizza] 📸 Scan the QR code below to link`.
6. **Smoke test**: send a WhatsApp message to the number from another
   phone. Confirm an order placed lands at
   `businesses/business_prashant/outlets/pizza-parsa/orders/...`.
7. **If it works**: remove the old PM2 entry from `ecosystem.config.js`.
8. **If it fails**: stop the new process, restart the old PM2
   process. The old session file at `bot/sessions/<bid>_<oid>/` is
   untouched, so the old process picks up where it left off.

Repeat for each tenant.

### Why this is safe

- **The new code is a no-op when `system/bot_routing/` is empty.**
  The orchestrator reads zero entries and creates zero sockets. You
  can deploy the new code and let it idle while you cut over tenants
  one at a time.
- **The old code's session files are at the same path
  (`bot/sessions/<bid>_<oid>/`) as the new code's.** When you cut
  back from new to old, the auth state is already there.
- **No DB schema migration.** The registry is a new node in
  Firebase; existing data is untouched.
- **No concurrent writes.** The old process and the new process
  never run for the same phone number at the same time.

### What we keep after cutover

- `bot/ecosystem.config.js` shrinks to a single entry:
  ```js
  module.exports = {
    apps: [{
      name: "foodhubbie-bot",
      script: "multi-tenant.js",
      cwd: __dirname,
      env: { FIREBASE_DATABASE_URL: "..." },
      watch: false,
      max_memory_restart: "600M"  // bumped from 300M
    }]
  };
  ```
- `FOODHUBBIE_BIZ_ID` / `FOODHUBBIE_OUTLET_ID` env vars are removed.
- The three old PM2 processes are deleted from the deploy config.

---

## 6. Rollback

If the multi-tenant orchestrator fails for any tenant at any point
during or after cutover:

1. `pm2 stop foodhubbie-bot` (the new process).
2. `pm2 start ecosystem.config.js` with the **old** config restored
   (kept in git history at the PR 15 commit).
3. Each old process re-authenticates from its existing session file
   at `bot/sessions/<bid>_<oid>/`.
4. Clear `system/bot_routing/` (or set all entries to `enabled:
   false`) so the next deploy of the new code is a no-op until the
   issue is diagnosed.

The rollback is **safe across deploys** because:
- The new code is dormant without a registry.
- The old code is dormant without the old PM2 entries.
- The two can be redeployed in either order without conflict.

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Baileys multi-socket stability** — running 3+ sockets in one process is less battle-tested than one socket per process. | Medium | High | Start with the lowest-traffic tenant. Keep the old PM2 process for 1 week after cutover. |
| **Memory ceiling** — 3 sockets × ~150MB each ≈ 500MB resident. The old per-process config was 300MB. | Medium | Medium | Bump `max_memory_restart` to 600MB. Add a memory-warning log if RSS exceeds 500MB. |
| **QR-scan race during cutover** — if the operator scans the wrong QR, a number links to the wrong tenant. | Low | High | Log the tenant label **prominently** above the QR code. The orchestrator prints `[<label>] Scan the QR code below to link <phoneNumber>`. |
| **Heartbeat collision** — two old processes and one new process all writing to the same `botStatus` path. | Low | Low | Each process only runs for one tenant. The new code is dormant until the old is stopped. Verify with `pm2 list` before each step. |
| **Session file deletion** — accidentally clearing `bot/sessions/<bid>_<oid>/` during cutover forces a re-link. | Low | Medium | The runbook never deletes session files. The seed script never touches them. |
| **Concurrent operator changes** — two operators cut over different tenants at the same time. | Low | Medium | Cutover is one operator, one tenant at a time. Document this in the runbook. |
| **Firebase read at boot fails** — orchestrator can't read `system/bot_routing/`. | Low | High | Orchestrator retries with exponential backoff. If still failing after 60s, exits 1 with a clear error. PM2 restarts it. |

---

## 8. Out of scope (Phase 3+)

- **Per-tenant feature flags** (e.g. disable ratings for one outlet).
  Would extend `tenantDescriptor` with a `features` map.
- **Cross-tenant broadcasts** ("send this promo to all Roshani
  outlets"). Would need a new engine handler that iterates sockets.
- **Hot-reload of the registry** (re-read `system/bot_routing/` on
  every message). For now, registry changes require a bot restart.
- **Per-tenant rate limits** (e.g. 100 msgs/min per outlet to avoid
  one tenant's spam blocking others).
- **Centralized dashboard** showing all tenants' `botStatus` in one
  view (currently each process writes independently to the same path
  shape, so a Realtime Database listener would Just Work — but no UI
  exists yet).

---

## 9. Open questions

- [ ] **Should `phoneNumber` in the registry include country code?**
  Yes, full international format without `+`. (Assumed; flag if
  wrong.)
- [ ] **Should we support a tenant having multiple WhatsApp numbers**
  (e.g. a separate number for customer support vs. orders)?
  Deferred to Phase 3. For now: one number per tenant.
- [ ] **Should `commands.js` and `status-monitor.js` be per-tenant or
  shared?** Per-tenant — they need to write to tenant-scoped paths
  and notify the right rider pool. PR 15 handles this.
- [ ] **What happens to the existing `outletOverride` parameter?**
  Removed. It was dead code. If you have a hidden caller I missed,
  flag before PR 14 starts.

---

## 10. Related docs

- `docs/data-sync.md` — RTDB tree, order lifecycle, multi-tenant
  invariants. **Read this first** for the data model context.
- `docs/brand-tokens.md` — per-app palettes (not directly relevant
  to the bot, but explains why per-tenant config matters).
- `bot/whatsapp-bot-ordering-flow.md` — the state machine PR 14
  preserves.
- `archive/Admin-Previous-legacy-v1/` — the v1 ShopAdmin; the bot
  predates the React rewrite but the multi-tenant model is the same
  direction.
