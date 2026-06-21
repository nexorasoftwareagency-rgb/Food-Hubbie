/**
 * ============================================================
 * FOODHUBBIE SAAS — Bot Tenant Registry Seeder
 * ============================================================
 * Registers a WhatsApp number → businessId/outletId mapping in
 * `system/bot_routing/` so the multi-tenant orchestrator
 * (bot/multi-tenant.js) can pick it up at next boot.
 *
 * Usage:
 *   node scripts/seed-bot-routing.js \
 *     --phone=919876543210 \
 *     --biz=business_roshani \
 *     --outlet=outlet_pizza \
 *     --label="Roshani Pizza Bot"
 *
 *   # Disable without removing:
 *   node scripts/seed-bot-routing.js --phone=919876543210 --enabled=false
 *
 *   # Remove an entry:
 *   node scripts/seed-bot-routing.js --phone=919876543210 --remove
 *
 * Environment:
 *   SERVICE_ACCOUNT_PATH (default: ../service-account.json)
 *   FIREBASE_DATABASE_URL (default: from config/firebase-config.js)
 *
 * See docs/bot-multi-tenant.md for the registry schema.
 * See docs/bot-operations.md for the cutover + new-tenant runbook.
 * ============================================================
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { FIREBASE_DATABASE_URL: CONFIG_DB_URL } = require('../config/firebase-config');

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue;
    const [k, ...rest] = a.slice(2).split('=');
    args[k] = rest.join('=');
  }
  return args;
}

function normalizePhone(raw) {
  if (!raw) return '';
  return String(raw).replace(/[^0-9]/g, '');
}

async function main() {
  const args = parseArgs(process.argv);

  const PHONE = normalizePhone(args.phone);
  const BIZ_ID = (args.biz || '').trim();
  const OUTLET_ID = (args.outlet || '').trim();
  const LABEL = (args.label || `${BIZ_ID}/${OUTLET_ID}`).trim();
  const ENABLED = args.enabled == null ? true : !['false', '0', 'no'].includes(String(args.enabled).toLowerCase());
  const REMOVE = args.remove != null;

  if (!PHONE) {
    console.error(
      "❌ Missing or invalid --phone.\n" +
      "   Use full international format without '+', e.g. --phone=919876543210"
    );
    process.exit(1);
  }

  if (!REMOVE && (!BIZ_ID || !OUTLET_ID)) {
    console.error(
      "❌ Missing required args.\n" +
      "   Required: --phone --biz --outlet\n" +
      "   Optional: --label, --enabled (true|false), --remove"
    );
    process.exit(1);
  }

  const SERVICE_ACCOUNT_PATH =
    process.env.SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '..', 'service-account.json');

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`❌ Service account not found at: ${SERVICE_ACCOUNT_PATH}`);
    console.error('   Set SERVICE_ACCOUNT_PATH or drop service-account.json at repo root.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || CONFIG_DB_URL,
    });
  }

  const db = admin.database();
  const ref = db.ref(`system/bot_routing/${PHONE}`);

  if (REMOVE) {
    await ref.remove();
    console.log(`🗑️  Removed entry for ${PHONE} from system/bot_routing/`);
    console.log('   Restart the bot to apply.');
    process.exit(0);
  }

  const entry = {
    businessId: BIZ_ID,
    outletId: OUTLET_ID,
    label: LABEL,
    enabled: ENABLED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await ref.set(entry);
  console.log(`\n✅ Registered ${PHONE} → ${BIZ_ID}/${OUTLET_ID} (label: ${LABEL}, enabled: ${ENABLED})`);
  console.log(`   Path: system/bot_routing/${PHONE}`);
  console.log('   Restart the bot to apply (or `pm2 restart foodhubbie-bot`).');
  console.log('\nNext steps:');
  console.log('   1. Stop the old PM2 process for this number (if any): pm2 stop foodhubbie-bot-<old-name>');
  console.log('   2. Restart the unified bot: pm2 restart foodhubbie-bot');
  console.log('   3. Scan the QR code shown at boot to link this WhatsApp number');
  console.log('   4. Send a test message to confirm the bot is online');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
