/**
 * ============================================================
 * FOODHUBBIE SAAS — Multi-Tenant Bot Orchestrator
 * ============================================================
 * Reads `system/bot_routing/` at boot, creates one Baileys
 * socket per enabled tenant, and binds a tenant-scoped engine
 * to each socket. Per-tenant session directories keep auth
 * state isolated; per-tenant heartbeats report status.
 *
 * Replaces the per-outlet PM2 model (PR 5 / PR 13) with a
 * single multi-socket process.
 *
 * Run: `node multi-tenant.js` (or via the npm start entry).
 * ============================================================
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const { db, tenantContext } = require('./firebase');
const { createEngine } = require('./whatsapp-engine');
const { initStatusMonitor } = require('./status-monitor');
const { initCommandListener } = require('./commands');
const { registerTenant: registerReportsCron, deregisterTenant: deregisterReportsCron } = require('./reports-cron');

const REGISTRY_PATH = 'system/bot_routing/';
const REGISTRY_READ_MAX_RETRIES = 6;   // 6 × 10s = 60s before giving up
const REGISTRY_READ_RETRY_DELAY_MS = 10000;

// ─── Registry Loading ────────────────────────────────────────

/**
 * Read the tenant registry from Firebase. Retries with backoff.
 * Returns an array of {phone, businessId, outletId, label, enabled}.
 */
async function loadRegistry() {
  let lastError = null;
  for (let attempt = 1; attempt <= REGISTRY_READ_MAX_RETRIES; attempt++) {
    try {
      const snap = await db.ref(REGISTRY_PATH).once('value');
      const raw = snap.val() || {};
      const tenants = Object.entries(raw)
        .map(([phone, descriptor]) => ({
          phone,
          businessId: descriptor?.businessId,
          outletId: descriptor?.outletId,
          label: descriptor?.label || `${descriptor?.businessId}/${descriptor?.outletId}`,
          enabled: descriptor?.enabled !== false
        }))
        .filter(t => t.enabled && t.businessId && t.outletId);

      if (tenants.length === 0) {
        console.log(`[Orchestrator] No enabled tenants in ${REGISTRY_PATH}. Idling.`);
      } else {
        console.log(`[Orchestrator] Loaded ${tenants.length} enabled tenant(s) from ${REGISTRY_PATH}.`);
      }
      return tenants;
    } catch (err) {
      lastError = err;
      console.error(`[Orchestrator] Registry read attempt ${attempt}/${REGISTRY_READ_MAX_RETRIES} failed: ${err.message}`);
      if (attempt < REGISTRY_READ_MAX_RETRIES) {
        await new Promise(r => setTimeout(r, REGISTRY_READ_RETRY_DELAY_MS));
      }
    }
  }
  throw new Error(`[Orchestrator] Could not read ${REGISTRY_PATH} after ${REGISTRY_READ_MAX_RETRIES} attempts: ${lastError?.message}`);
}

// ─── Per-Tenant Boot ─────────────────────────────────────────

async function bootTenant(tenant) {
  const log = (...a) => console.log(`[${tenant.label}]`, ...a);
  const logErr = (...a) => console.error(`[${tenant.label}]`, ...a);

  const sessionPath = path.join(__dirname, 'sessions', `${tenant.businessId}_${tenant.outletId}`);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
  log(`📂 Session dir: ${sessionPath}`);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['Foodhubbie SaaS', 'Chrome', '1.0.0']
  });
  sock.ev.on('creds.update', saveCreds);

  const engine = createEngine(tenant);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log(`\n📸 [${tenant.label}] (${tenant.phone}) Scan the QR code below to link this WhatsApp number:`);
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      log(`✅ BOT IS ONLINE [${tenant.businessId}/${tenant.outletId}] (${tenant.phone})`);

      // Per-tenant listeners
      initStatusMonitor(sock, tenant);
      initCommandListener(sock, tenant);
      registerReportsCron(sock, tenant);

      // Per-tenant heartbeat — writes to the tenant's own botStatus path
      setInterval(() => {
        const t = tenantContext(tenant);
        t.updateData('botStatus', {
          lastSeen: Date.now(),
          status: 'Online',
          businessId: tenant.businessId,
          outletId: tenant.outletId,
          phone: tenant.phone
        }).catch(() => {});
      }, 60000).unref();
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logErr(`\n❌ [${tenant.label}] Connection closed. Reconnecting this tenant only: ${shouldReconnect}`);
      try { deregisterReportsCron(tenant); } catch (_) { /* noop */ }
      if (shouldReconnect) {
        // Per-tenant reconnect — does not affect other tenants in the process
        setTimeout(() => bootTenant(tenant).catch(e => logErr('Reconnect failed:', e.message)), 5000);
      } else {
        logErr(`\n❌ [${tenant.label}] Logged out. Re-scan the QR code (restart the process or register the tenant again).`);
      }
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    for (const msg of m.messages) {
      if (!msg.message || msg.key.fromMe) continue;
      try {
        await engine.handleIncomingMessage(sock, msg);
      } catch (err) {
        logErr(`[Engine Error] ${msg.key.remoteJid}:`, err.message);
      }
    }
  });
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log(`\n🤖 [Orchestrator] Booting Foodhubbie Multi-Tenant Bot...`);
  const tenants = await loadRegistry();

  if (tenants.length === 0) {
    console.log('🤖 [Orchestrator] Nothing to boot. Process will idle until the registry changes (restart to pick up new tenants).');
    // Keep the process alive so PM2 doesn't mark it as errored.
    // Operator can `pm2 restart foodhubbie-bot` after registering a tenant.
    setInterval(() => {}, 1 << 30);
    return;
  }

  console.log('🤖 [Orchestrator] Booting tenants:');
  for (const t of tenants) {
    console.log(`   - ${t.label} (phone ${t.phone}) → ${t.businessId}/${t.outletId}`);
  }

  // Boot all tenants in parallel — sockets are independent.
  await Promise.allSettled(tenants.map(t => bootTenant(t)));
}

process.on('uncaughtException', (err) => console.error('CRITICAL UNCAUGHT ERROR:', err));
process.on('unhandledRejection', (err) => console.error('CRITICAL UNHANDLED REJECTION:', err));

main().catch((e) => {
  console.error('💥 [Orchestrator] Fatal:', e);
  process.exit(1);
});
