/**
 * ============================================================
 * FOODHUBBIE SAAS — Bot Audit Logger (tenant-aware)
 * ============================================================
 * Logs bot interactions to the global `logs/botAudit` node.
 * The entry is stamped with the tenant identity when provided.
 * ============================================================
 */

const { pushData } = require('./firebase');

/**
 * Log a bot interaction or automated action to the audit trail.
 *
 * @param {string} action - Action name, e.g. 'BOT_RESET', 'BOT_ORDER_PLACED'
 * @param {object} details - Arbitrary detail object
 * @param {string} jid - WhatsApp JID or 'system'
 * @param {{businessId: string, outletId: string, label?: string}|null} tenant - The active tenant
 */
async function logBotAudit(action, details = {}, jid = 'system', tenant = null) {
  try {
    const entry = {
      timestamp: Date.now(),
      action,
      details,
      whatsappJid: jid,
      businessId: tenant?.businessId || null,
      outletId: tenant?.outletId || null,
      userAgent: 'Foodhubbie-Bot-Engine/1.0'
    };

    // `logs/` is in GLOBAL_NODES, so resolvePath leaves the path
    // alone. No bid/oid needed at the call site.
    await pushData('logs/botAudit', entry);
    console.log(`[Bot-Audit] Action Logged: ${action} for ${jid}`);
  } catch (err) {
    console.error(`[Bot-Audit] Failed to log ${action}:`, err.message);
  }
}

module.exports = { logBotAudit };
