# Bot — Operations Runbook

> **Status:** Active  
> **Audience:** DevOps, on-call engineers  
> **Last updated:** 2026-06-04  
> **Format:** Code-Logics · Firebase-Rules · Database-Structure · Connecting-Nodes · Complete-Flows  
> **See also:** `docs/02-bot/02-Multi-Tenant-Bot-Engine.md` (canonical engine doc) · `docs/02-bot/02-Order-Status-Monitor.md` (status handler) · `docs/03-foundation/03-Deployment-and-Hosting.md` (PM2 + EC2)

This is the operator's playbook for the multi-tenant WhatsApp bot
(PRs 13–16). For architecture / data model / cutover strategy, see
`docs/bot-multi-tenant.md`. For the registry schema itself, see
`docs/bot-multi-tenant.md` §3.

---

## 1. Daily operations

### List registered tenants

```bash
node scripts/list-bot-tenants.js
```

Output:
```
🤖 3 tenant(s) in system/bot_routing/:

PHONE         LABEL                BUSINESS_ID       OUTLET_ID     ON  CREATED
--------------------------------------------------------------------------------
919876543210  Roshani Cake Bot     business_roshani  outlet_cake   yes 2026-06-01T...
919876543211  Roshani Pizza Bot    business_roshani  outlet_pizza  yes 2026-06-01T...
919876543212  Prashant Pizza Bot   business_prashant pizza-parsa   yes 2026-06-01T...

3 enabled, 0 disabled.
Bot will boot 3 socket(s) on next restart.
```

### Tail bot logs

```bash
pm2 logs foodhubbie-bot
```

Each line is prefixed with the tenant label, e.g. `[roshani-pizza]`.
To follow only one tenant:

```bash
pm2 logs foodhubbie-bot | grep '\[roshani-pizza\]'
```

### Check bot health

Every socket writes a heartbeat to its own `botStatus` node every
60s. From the admin dashboard or via the Firebase console:

```
businesses/<bid>/outlets/<oid>/botStatus
```

Or via the bot's logs:

```bash
pm2 logs foodhubbie-bot --lines 100 | grep 'BOT IS ONLINE'
```

You should see one `BOT IS ONLINE` line per enabled tenant. If
one is missing, that tenant's socket is disconnected.

---

## 2. Adding a new tenant

The new-tenant flow is the whole point of the multi-tenant bot:
no code change, no deploy, no new PM2 entry. Just a registry write
+ a QR scan.

### Pre-requisites

1. The business + outlet already exist in the database (run
   `scripts/seed-business.js` first if not).
2. You have a WhatsApp Business number ready to link. The number
   must **not** be currently linked to another bot process (you
   can only have one socket per number).
3. You can scan the QR code from the bot's terminal (or have a
   teammate do it).

### Steps

```bash
# 1. Register the tenant in the registry
node scripts/seed-bot-routing.js \
  --phone=919876543213 \
  --biz=business_newgroup \
  --outlet=outlet_main \
  --label="New Group Main Bot"

# 2. Verify
node scripts/list-bot-tenants.js
# Should now show 4 tenants.

# 3. Restart the bot
pm2 restart foodhubbie-bot

# 4. Watch the logs
pm2 logs foodhubbie-bot --lines 100
```

You should see a new QR code for the new number:

```
[newgroup-main] (919876543213) Scan the QR code below to link this WhatsApp number:
[QR CODE]
```

**Important:** the QR code is per-tenant. If multiple tenants need
linking at the same time, each one prints its own QR. Scan each one
with the corresponding phone.

### Verify it's working

1. Send a WhatsApp message to the new number from a different phone.
2. The bot should reply with the welcome / discovery message.
3. Place a small test order; check that it lands at:
   ```
   businesses/business_newgroup/outlets/outlet_main/orders/<orderId>
   ```

### Troubleshooting

- **Bot doesn't print a QR code for the new tenant.** Check that
  `enabled: true` in the registry. If you just registered it, the
  bot needs a restart — re-run `pm2 restart foodhubbie-bot`.
- **QR code expires before you scan it.** They don't expire while
  the socket is trying to connect. If the QR disappears, the bot
  has finished its initial connect attempt and is waiting for a
  new link event — restart again.
- **The same number is registered twice.** The script overwrites
  the previous entry. To re-link, register the same number with
  new `--biz/--outlet` and restart.

---

## 3. Disabling a tenant (without removing it)

To temporarily stop a tenant's bot (e.g., the shop is closed for
renovation):

```bash
node scripts/seed-bot-routing.js --phone=919876543212 --enabled=false
pm2 restart foodhubbie-bot
```

The bot will boot 2 sockets instead of 3. The disabled tenant's
session file at `bot/sessions/<bid>_<oid>/` is preserved, so
re-enabling later is just:

```bash
node scripts/seed-bot-routing.js --phone=919876543212 --enabled=true
pm2 restart foodhubbie-bot
```

(No need to re-scan the QR code — auth state is still on disk.)

---

## 4. Removing a tenant (permanent)

```bash
node scripts/seed-bot-routing.js --phone=919876543212 --remove
pm2 restart foodhubbie-bot
```

**Optional cleanup:** delete the session file too so a future
re-register of the same number starts fresh:

```bash
rm -rf bot/sessions/business_prashant_pizza-parsa/
```

Only do this if you **want** the operator to re-scan the QR. If
the number will be re-registered, keep the session dir — it
re-links without a new QR.

---

## 5. Re-linking a WhatsApp number (after logout)

If a tenant's WhatsApp number was logged out (e.g., the operator
uninstalled the WhatsApp app, or the session expired), the bot
will log:

```
[roshani-pizza] Logged out. Re-scan the QR code (restart the process or register the tenant again).
```

**Recovery steps:**

1. Verify the tenant is still in the registry:
   `node scripts/list-bot-tenants.js`
2. Delete the session file so the bot generates a new auth state:
   ```bash
   rm -rf bot/sessions/business_roshani_outlet_pizza/
   ```
3. Restart the bot: `pm2 restart foodhubbie-bot`
4. Scan the new QR code shown in the logs.
5. Verify with a test message.

If the number is still linked to another device (e.g., the
operator's personal phone), the QR scan will fail. Have the
operator log out of WhatsApp Web/Desktop first.

---

## 6. Debugging a single-tenant outage

The multi-tenant bot isolates outages: a crash in one socket does
not affect the others. To diagnose:

### Is the socket still connected?

```bash
pm2 logs foodhubbie-bot --lines 200 | grep -E '\[<tenant-label>\]'
```

Look for the last `BOT IS ONLINE` line for that tenant. If
there's been a `Connection closed` line, the orchestrator is
reconnecting. If you see "Reconnecting this tenant only: false",
the tenant was logged out — see §5.

### Is the heartbeat fresh?

```bash
# In a Firebase console or via the Admin dashboard
businesses/<bid>/outlets/<oid>/botStatus
```

The `lastSeen` timestamp should be < 90 seconds old (60s heartbeat
+ 30s slack). If it's stale, the socket is hung or the orchestrator
restart loop failed.

### Is the registry still pointing at the right place?

```bash
node scripts/list-bot-tenants.js
```

Make sure the tenant's `businessId` and `outletId` are correct. A
typo here would route messages to a different (or non-existent)
tenant.

### Restart just one tenant

PM2 only restarts the whole process, but you can stop all sockets
and re-boot in a controlled way:

```bash
# This will disconnect all tenants for ~10s
pm2 restart foodhubbie-bot
```

For a single-tenant restart without affecting others, the cleanest
option is:

1. Disable the affected tenant: `... --phone=... --enabled=false`
2. `pm2 restart foodhubbie-bot`
3. Re-enable: `... --phone=... --enabled=true`
4. `pm2 restart foodhubbie-bot`

(The double restart is needed because the orchestrator only reads
the registry at boot.)

---

## 7. Cutover from the old PM2 setup

This is the migration from the "one PM2 process per outlet" model
to the unified multi-tenant bot. **Critical:** each WhatsApp
number can be linked to exactly one socket at a time, so this is
a per-tenant cutover, not a big-bang.

### Per-tenant cutover

For each tenant, in order of lowest traffic first:

1. **Pick a tenant.** (Start with the lowest-volume outlet.)
2. **Register it** in the new registry:
   ```bash
   node scripts/seed-bot-routing.js \
     --phone=919876543212 \
     --biz=business_prashant \
     --outlet=pizza-parsa \
     --label="Prashant Pizza Bot"
   ```
3. **Stop its old PM2 process**:
   ```bash
   pm2 stop foodhubbie-bot-prashant-pizza
   ```
4. **Deploy the new code** (if you haven't already). The new
   `index.js` delegates to `multi-tenant.js`. PM2's
   `foodhubbie-bot` process must be running, with the new
   `ecosystem.config.js` deployed.
5. **Restart the unified bot** so it picks up the new registry
   entry:
   ```bash
   pm2 restart foodhubbie-bot
   ```
6. **Watch for the QR code** for that phone number:
   ```bash
   pm2 logs foodhubbie-bot --lines 100
   ```
   Look for `[prashant-pizza] (919876543212) Scan the QR code below`.
7. **Scan the QR code** from the corresponding WhatsApp account.
8. **Smoke test**: send a WhatsApp message, place a small order,
   verify it lands at the right path.
9. **Verify heartbeat** in `botStatus` is fresh.
10. **Remove the old PM2 entry** from `ecosystem.config.js` and
    delete it: `pm2 delete foodhubbie-bot-prashant-pizza`.
11. **Repeat for the next tenant.**

### When all tenants are migrated

```bash
# Final restart
pm2 restart foodhubbie-bot

# Verify all tenants
node scripts/list-bot-tenants.js
# Should show all of them enabled.

# Tail logs to confirm all are online
pm2 logs foodhubbie-bot --lines 200 | grep 'BOT IS ONLINE'
# Should show one per tenant.

# Remove old PM2 processes
pm2 delete foodhubbie-bot-roshani-pizza
pm2 delete foodhubbie-bot-roshani-cake
pm2 delete foodhubbie-bot-prashant-pizza
pm2 save
```

### Rollback (if anything goes wrong)

See `docs/bot-multi-tenant.md` §6. TL;DR:

1. `pm2 stop foodhubbie-bot`
2. Restore the old `ecosystem.config.js` from git history.
3. `pm2 start ecosystem.config.js` (old)
4. Old processes re-authenticate from existing session files.
5. Clear `system/bot_routing/` or set all entries to `enabled: false`
   so the new code is dormant.

---

## 8. Common operational questions

### "I added a new tenant but the bot didn't pick it up."

Restart the bot. The orchestrator only reads the registry at boot.

### "Two tenants are writing to the same businessId/outletId."

The registry doesn't enforce uniqueness on `(businessId, outletId)`.
The current model assumes one socket per (bid, oid) pair. If you
need two bots for the same outlet (e.g., during a load test), use
a different `outletId` and adjust the data path.

### "The bot is using 700MB of memory."

Bump `max_memory_restart` in `bot/ecosystem.config.js` or split
tenants across multiple machines. Each socket is ~150MB resident
in our measurements; 10 tenants on one machine is the soft limit.

### "How do I see what the engine is doing for a specific user?"

The engine logs are prefixed with the tenant label. To follow a
specific conversation, grep for the JID:

```bash
pm2 logs foodhubbie-bot | grep '919876543210'  # by customer phone
pm2 logs foodhubbie-bot | grep 'FH-1717228800'  # by order id
```

The audit trail is at `logs/botAudit` in Firebase.

### "Can I hot-reload the registry (no restart)?"

Not yet. Tracked as a Phase 3 feature in
`docs/bot-multi-tenant.md` §8.

---

## 9. Related docs

- `docs/bot-multi-tenant.md` — architecture, data model, cutover
  strategy, rollback plan. **Read this first.**
- `docs/data-sync.md` — RTDB tree, order lifecycle, multi-tenant
  invariants. Read for the data model context.
- `bot/whatsapp-bot-ordering-flow.md` — the state machine, in case
  you need to trace a customer through the ordering flow.
- `docs/brand-tokens.md` — per-app palettes (the bot doesn't use
  these, but admins do — explains the broader tenant-config story).
