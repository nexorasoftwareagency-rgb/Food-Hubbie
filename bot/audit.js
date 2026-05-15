const { pushData, BUSINESS_ID, OUTLET_ID } = require('./firebase');

/**
 * Log a bot interaction or automated action to the audit trail
 */
async function logBotAudit(action, details = {}, jid = 'system') {
    try {
        const path = `logs/botAudit`;
        const entry = {
            timestamp: Date.now(),
            action,
            details,
            whatsappJid: jid,
            businessId: BUSINESS_ID,
            outletId: OUTLET_ID,
            userAgent: 'Foodhubbie-Bot-Engine/1.0'
        };
        
        await pushData(path, entry);
        console.log(`[Bot-Audit] Action Logged: ${action} for ${jid}`);
    } catch (err) {
        console.error(`[Bot-Audit] Failed to log ${action}:`, err.message);
    }
}

module.exports = { logBotAudit };
