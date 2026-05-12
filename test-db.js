const admin = require('firebase-admin');
const serviceAccount = require('./bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function testFetch() {
  console.log("🔍 Testing Business Fetch...");
  const snap = await db.ref('businesses').once('value');
  const data = snap.val();
  console.log("Data present:", !!data);
  if (data) {
    console.log("Business Keys:", Object.keys(data));
    for (const bid in data) {
      const outlets = data[bid].outlets || {};
      console.log(`- Business ${bid} has ${Object.keys(outlets).length} outlets.`);
      for (const oid in outlets) {
        console.log(`  - Outlet: ${oid} (${outlets[oid].name})`);
      }
    }
  } else {
    console.log("❌ No businesses found!");
  }
  process.exit(0);
}

testFetch().catch(console.error);
