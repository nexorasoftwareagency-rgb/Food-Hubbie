/**
 * ============================================================
 * FOODHUBBIE SAAS — Catalog Sync Between Outlets
 * ============================================================
 * Copies the Menu / categories / dishes tree from one outlet
 * to another (within or across businesses). Useful for cloning
 * a proven catalog when onboarding a new tenant.
 *
 * Usage:
 *   node scripts/sync-catalog.js \
 *     --fromBiz=business_prashant --fromOutlet=pizza-parsa \
 *     --toBiz=business_roshani   --toOutlet=outlet_pizza
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

async function main() {
  const args = parseArgs(process.argv);

  const fromBiz = (args.fromBiz || '').trim();
  const fromOutlet = (args.fromOutlet || '').trim();
  const toBiz = (args.toBiz || '').trim();
  const toOutlet = (args.toOutlet || '').trim();

  if (!fromBiz || !fromOutlet || !toBiz || !toOutlet) {
    console.error(
      "❌ Missing required args.\n" +
      "   Required: --fromBiz --fromOutlet --toBiz --toOutlet"
    );
    process.exit(1);
  }

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
  const sourcePath = `businesses/${fromBiz}/outlets/${fromOutlet}`;
  const targetPath = `businesses/${toBiz}/outlets/${toOutlet}`;

  console.log(`\n🔄 Syncing catalog: ${sourcePath} → ${targetPath}`);

  const sourceSnap = await db.ref(sourcePath).once('value');
  const sourceData = sourceSnap.val();

  if (!sourceData) {
    console.error(`❌ Source outlet not found: ${sourcePath}`);
    process.exit(1);
  }

  const catalogUpdates = {
    Menu: sourceData.Menu || {},
    categories: sourceData.categories || {},
    dishes: sourceData.dishes || {},
  };

  await db.ref(targetPath).update(catalogUpdates);

  const targetSnap = await db.ref(targetPath).once('value');
  const targetData = targetSnap.val();
  console.log(`\n--- Verification ---`);
  console.log(`Target Outlet: ${targetData.name}`);
  console.log(`Categories Count: ${Object.keys(targetData.categories || {}).length}`);
  console.log(`Dishes Count: ${Object.keys(targetData.dishes || {}).length}`);
  console.log(`\n✅ Sync complete!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
