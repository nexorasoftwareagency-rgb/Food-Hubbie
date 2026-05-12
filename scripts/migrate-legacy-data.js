/**
 * ============================================================
 * FOODHUBBIE SAAS — Real Data Migration Script
 * ============================================================
 * Migrates Roshani Pizza and Roshani Cake data from the legacy
 * project (LEGACY_PROJECT) to the new SaaS project (food-hubbie).
 * 
 * RUNNING THIS:
 *   node scripts/migrate-legacy-data.js [--live]
 * ============================================================
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const isLive = process.argv.includes('--live');
const BUSINESS_ID = "business_roshani";

// ─── Path Config ──────────────────────────────────────────

const LEGACY_SA_PATH = path.join(__dirname, '../service-account.json');
const NEW_SA_PATH = path.join(__dirname, '../food-hubbie-firebase-adminsdk-fbsvc-4b2c8e7f78.json');

const LEGACY_DB_URL = ""; // Legacy URL removed
const NEW_DB_URL = "https://food-hubbie-default-rtdb.firebaseio.com";

// ─── Initialize Apps ──────────────────────────────────────

const legacyApp = admin.initializeApp({
  credential: admin.credential.cert(require(LEGACY_SA_PATH)),
  databaseURL: LEGACY_DB_URL
}, 'legacy');

const newApp = admin.initializeApp({
  credential: admin.credential.cert(require(NEW_SA_PATH)),
  databaseURL: NEW_DB_URL
}, 'new');

const legacyDb = legacyApp.database();
const newDb = newApp.database();

const MAPPING = [
  { legacy: 'pizza', outlet: 'outlet_pizza', name: 'Roshani Pizza' },
  { legacy: 'cake', outlet: 'outlet_cake', name: 'Roshani Cake' }
];

async function migrate() {
  console.log(`\n🚀 Starting Migration [${isLive ? 'LIVE' : 'DRY RUN'}]`);

  // 1. Create Business Profile
  const bizProfile = {
    id: BUSINESS_ID,
    name: "Roshani Foods",
    owner: "Prasant",
    status: "active",
    createdAt: new Date().toISOString()
  };
  
  if (isLive) {
    await newDb.ref(`businesses/${BUSINESS_ID}/profile`).set(bizProfile);
    console.log("✅ Business profile created.");
  }

  for (const map of MAPPING) {
    console.log(`\n📦 Processing Outlet: ${map.name} (${map.legacy} -> ${map.outlet})`);
    
    // Nodes to migrate
    const nodes = ['menu', 'categories', 'dishes', 'addons', 'settings', 'inventory', 'botUsers', 'profiles'];
    
    for (const node of nodes) {
      console.log(`   - Migrating node: ${node}...`);
      const snap = await legacyDb.ref(`${map.legacy}/${node}`).once('value');
      const data = snap.val();
      
      if (data) {
        const newPath = `businesses/${BUSINESS_ID}/outlets/${map.outlet}/${node}`;
        if (isLive) {
          await newDb.ref(newPath).set(data);
          console.log(`     ✅ Migrated to ${newPath}`);
        } else {
          console.log(`     🔍 [Dry Run] Would migrate to ${newPath} (${Object.keys(data).length} keys)`);
        }
      } else {
        console.log(`     ⏭️ No data found at ${map.legacy}/${node}`);
      }
    }

    // Create Outlet Meta
    const meta = {
      id: map.outlet,
      businessId: BUSINESS_ID,
      name: map.name,
      slug: map.legacy,
      status: "active"
    };
    if (isLive) {
      await newDb.ref(`businesses/${BUSINESS_ID}/outlets/${map.outlet}/meta`).set(meta);
      console.log(`   ✅ Meta data created for ${map.outlet}`);
    }
  }

  // 2. Global Nodes (Admins, Riders)
  const globals = ['admins', 'riders'];
  for (const node of globals) {
    console.log(`\n🌐 Migrating global node: ${node}...`);
    const snap = await legacyDb.ref(node).once('value');
    const data = snap.val();
    if (data) {
      if (isLive) {
        await newDb.ref(node).set(data);
        console.log(`   ✅ Global node ${node} migrated.`);
      } else {
        console.log(`   🔍 [Dry Run] Would migrate global ${node}`);
      }
    }
  }

  console.log("\n🏁 Migration complete.");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
