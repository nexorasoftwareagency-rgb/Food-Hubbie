const admin = require('firebase-admin');
const serviceAccount = require('../bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function cleanupOrders(path) {
  console.log(`\n🧹 Cleaning up: ${path}...`);
  const ref = db.ref(path);
  const snapshot = await ref.once('value');
  
  if (!snapshot.exists()) {
    console.log(`  - No orders found at ${path}`);
    return;
  }

  const orders = snapshot.val();
  const orderList = Object.entries(orders).map(([id, data]) => ({
    id,
    createdAt: data.createdAt || 0
  }));

  // Sort by createdAt descending
  orderList.sort((a, b) => {
    const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
    const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
    return timeB - timeA;
  });

  if (orderList.length <= 5) {
    console.log(`  - Already have ${orderList.length} or fewer orders. Skipping.`);
    return;
  }

  const toKeep = orderList.slice(0, 5);
  const toDelete = orderList.slice(5);

  console.log(`  - Keeping: ${toKeep.length} orders`);
  console.log(`  - Deleting: ${toDelete.length} orders`);

  const updates = {};
  toDelete.forEach(o => {
    updates[o.id] = null;
  });

  await ref.update(updates);
  console.log(`  ✅ Cleanup complete for ${path}`);
}

async function run() {
  try {
    // 1. Cleanup Legacy Structures
    await cleanupOrders('pizza/orders');
    await cleanupOrders('cake/orders');

    // 2. Cleanup New SaaS Structure
    const businessesSnap = await db.ref('businesses').once('value');
    if (businessesSnap.exists()) {
      const businesses = businessesSnap.val();
      for (const bizId in businesses) {
        const outlets = businesses[bizId].outlets || {};
        for (const outletId in outlets) {
          await cleanupOrders(`businesses/${bizId}/outlets/${outletId}/orders`);
        }
      }
    }

    console.log('\n🌟 ALL CLEANUP TASKS FINISHED.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR DURING CLEANUP:', err);
    process.exit(1);
  }
}

run();
