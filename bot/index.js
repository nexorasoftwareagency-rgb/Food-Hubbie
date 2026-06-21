/**
 * ============================================================
 * FOODHUBBIE SAAS — Bot Entry Point (multi-tenant)
 * ============================================================
 * Thin entry that delegates to the multi-tenant orchestrator.
 * Kept as `index.js` so `npm start` and the existing PM2 entry
 * (script: "index.js") continue to work without changes.
 *
 * For tenant registry schema, see docs/bot-multi-tenant.md.
 * For cutover / new-tenant runbook, see docs/bot-operations.md.
 * ============================================================
 */

require('./multi-tenant');
