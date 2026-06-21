/**
 * ============================================================
 * FOODHUBBIE SAAS — Bot Tenant Registry Lister (debug)
 * ============================================================
 * Prints the current contents of `system/bot_routing/` so an
 * operator can verify which tenants the multi-tenant bot will
 * boot on next restart.
 *
 * Usage:
 *   node scripts/list-bot-tenants.js
 *
 * Environment:
 *   SERVICE_ACCOUNT_PATH (default: ../service-account.json)
 *   FIREBASE_DATABASE_URL (default: from config/firebase-config.js)
 * ============================================================
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { FIREBASE_DATABASE_URL: CONFIG_DB_URL } = require('../config/firebase-config');

async function main() {
  const SERVICE_ACCOUNT_PATH =
    process.env.SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '..', 'service-account.json');

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`❌ Service account not found at: ${SERVICE_ACCOUNT_PATH}`);
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
  const snap = await db.ref('system/bot_routing/').once('value');
  const raw = snap.val() || {};

  const entries = Object.entries(raw);
  if (entries.length === 0) {
    console.log('\n🤖 No tenants registered in system/bot_routing/.');
    console.log('   The multi-tenant bot will idle on next restart.');
    console.log('   Run: node scripts/seed-bot-routing.js --phone=... --biz=... --outlet=...');
    process.exit(0);
  }

  console.log(`\n🤖 ${entries.length} tenant(s) in system/bot_routing/:\n`);

  const rows = entries.map(([phone, e]) => ({
    phone,
    businessId: e.businessId || '(missing)',
    outletId: e.outletId || '(missing)',
    label: e.label || `${e.businessId}/${e.outletId}`,
    enabled: e.enabled !== false ? 'yes' : 'no',
    createdAt: e.createdAt || '?',
  })).sort((a, b) => a.label.localeCompare(b.label));

  const widths = {
    phone: Math.max(5, ...rows.map(r => r.phone.length)),
    label: Math.max(5, ...rows.map(r => r.label.length)),
    businessId: Math.max(11, ...rows.map(r => r.businessId.length)),
    outletId: Math.max(8, ...rows.map(r => r.outletId.length)),
  };

  const line = (cols) => Object.values(cols).map((v, i) => String(v).padEnd(Object.values(widths)[i])).join('  ');
  console.log(line({ phone: 'PHONE', label: 'LABEL', businessId: 'BUSINESS_ID', outletId: 'OUTLET_ID', enabled: 'ON', createdAt: 'CREATED' }));
  console.log('-'.repeat(Object.values(widths).reduce((s, w) => s + w, 0) + 8));
  for (const r of rows) {
    console.log(line(r));
  }

  const enabled = rows.filter(r => r.enabled === 'yes').length;
  console.log(`\n${enabled} enabled, ${rows.length - enabled} disabled.`);
  console.log(`Bot will boot ${enabled} socket(s) on next restart.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ List failed:', err);
  process.exit(1);
});
