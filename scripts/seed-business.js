/**
 * ============================================================
 * FOODHUBBIE SAAS — Parameterized Business Seeder
 * ============================================================
 * Replaces the one-off `ingest-pizza-data.js` script with a
 * generic, multi-tenant seeder.
 *
 * Usage:
 *   node scripts/seed-business.js \
 *     --biz=business_prashant \
 *     --outlet=pizza-parsa \
 *     --slug=pizza-parsa \
 *     --name="Prashant Pizza (Parsa)" \
 *     --entity="Prashant Group" \
 *     --address="Near Government Hospital Parsa, Saran - 841219" \
 *     --lat=25.87143 --lng=84.9923783 \
 *     --fixture=./extracted_pizza_data.json
 *
 * Environment:
 *   SERVICE_ACCOUNT_PATH (default: ../service-account.json)
 *   FIREBASE_DATABASE_URL (default: from config/firebase-config.js)
 *
 * Required fixture JSON shape (same as the legacy script):
 *   { Menu: {...}, categories: {...}, dishes: {...}, riderStats: {...} }
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

  const BIZ_ID = (args.biz || '').trim();
  const OUTLET_ID = (args.outlet || '').trim();
  const SLUG = (args.slug || '').trim();
  const NAME = (args.name || '').trim();
  const ENTITY = (args.entity || NAME).trim();
  const ADDRESS = (args.address || '').trim();
  const LAT = parseFloat(args.lat || '0');
  const LNG = parseFloat(args.lng || '0');
  const FIXTURE = args.fixture || '';

  if (!BIZ_ID || !OUTLET_ID || !SLUG || !NAME) {
    console.error(
      "❌ Missing required args.\n" +
      "   Required: --biz --outlet --slug --name\n" +
      "   Optional: --entity --address --lat --lng --fixture"
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

  console.log(`\n🚀 Seeding ${BIZ_ID}/${OUTLET_ID} (slug: ${SLUG})...`);

  // 1. Business node
  await db.ref(`businesses/${BIZ_ID}`).update({
    name: ENTITY,
    status: 'Active',
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  // 2. Outlet data
  const outletPath = `businesses/${BIZ_ID}/outlets/${OUTLET_ID}`;
  const outletData = {
    name: NAME,
    status: 'Active',
    meta: {
      name: NAME,
      slug: SLUG,
      createdAt: new Date().toISOString(),
      location: {
        address: ADDRESS,
        lat: LAT,
        lng: LNG,
      },
    },
    settings: {
      Store: {
        storeName: NAME,
        entityName: ENTITY,
        createdAt: new Date().toISOString(),
      },
      shopOpen: true,
      ...(LAT ? { location: { lat: LAT, lng: LNG } } : {}),
    },
  };

  // 3. Optional fixture merge (Menu, categories, dishes, riderStats)
  if (FIXTURE) {
    const fixturePath = path.isAbsolute(FIXTURE)
      ? FIXTURE
      : path.join(process.cwd(), FIXTURE);
    if (!fs.existsSync(fixturePath)) {
      console.error(`❌ Fixture file not found: ${fixturePath}`);
      process.exit(1);
    }
    const extracted = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    if (extracted.Menu) outletData.Menu = extracted.Menu;
    if (extracted.categories) outletData.categories = extracted.categories;
    if (extracted.dishes) outletData.dishes = extracted.dishes;
    if (extracted.riderStats) outletData.riderStats = extracted.riderStats;
    console.log(`   • Catalog loaded from ${fixturePath}`);
  }

  await db.ref(outletPath).set(outletData);
  console.log(`✅ Outlet node written: ${outletPath}`);

  // 4. Slug registration
  await db.ref(`slugs/outlets/${SLUG}`).set({
    businessId: BIZ_ID,
    outletId: OUTLET_ID,
  });
  console.log(`✅ Slug registered: /${SLUG}`);

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
