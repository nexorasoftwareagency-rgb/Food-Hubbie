/**
 * ============================================================
 * FOODHUBBIE SAAS — Bot Ecosystem Config (PM2, single-app)
 * ============================================================
 * Replaces the per-outlet PM2 model with a single multi-tenant
 * process. The orchestrator reads `system/bot_routing/` at boot
 * and creates one socket per enabled entry — no env-var config
 * per outlet.
 *
 * Memory bumped to 600M (was 300M per process) because one
 * process now holds N sockets. With 3 tenants, each socket is
 * ~150MB resident; with 10 tenants, plan to bump further or
 * split across machines.
 *
 * For tenant registry schema, see docs/bot-multi-tenant.md.
 * For cutover / new-tenant runbook, see docs/bot-operations.md.
 * ============================================================
 */

module.exports = {
  apps: [
    {
      name: "foodhubbie-bot",
      script: "index.js",
      cwd: __dirname,
      env: {
        // Only the database URL is needed as an env var; tenant
        // identity is read from system/bot_routing/ in Firebase.
        FIREBASE_DATABASE_URL: "https://food-hubbie-default-rtdb.firebaseio.com"
      },
      watch: false,
      max_memory_restart: "600M",
      // Auto-restart on crash; back off so we don't hammer Firebase
      // if the registry read is broken.
      exp_backoff_restart_delay: 5000,
      max_restarts: 20
    }
  ]
};
