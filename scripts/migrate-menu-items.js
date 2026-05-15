const admin = require('firebase-admin');
const serviceAccount = require('../bot/service-account.json');

// Initialize with service account from bot folder
const FIREBASE_DATABASE_URL = "https://food-hubbie-default-rtdb.firebaseio.com"; // Verified from config

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FIREBASE_DATABASE_URL
});

const db = admin.database();

async function migrateMenuItems() {
  console.log('🚀 Starting MenuItem Migration (outletName Backfill)...');
  
  try {
    const businessesSnap = await db.ref('businesses').once('value');
    const businesses = businessesSnap.val();
    
    if (!businesses) {
      console.log('No businesses found.');
      process.exit(0);
    }

    let totalUpdated = 0;
    
    for (const bid in businesses) {
      const bData = businesses[bid];
      if (!bData.outlets) continue;
      
      for (const oid in bData.outlets) {
        const outlet = bData.outlets[oid];
        const storeName = outlet.settings?.Store?.storeName || outlet.meta?.name || "Restaurant";
        
        console.log(`Processing Outlet: ${oid} (${storeName}) in Business: ${bid}`);
        
        const dishesRef = db.ref(`businesses/${bid}/outlets/${oid}/dishes`);
        const dishesSnap = await dishesRef.once('value');
        const dishes = dishesSnap.val();
        
        if (!dishes) {
          console.log(`  - No dishes found for ${oid}`);
          continue;
        }

        const updates = {};
        Object.keys(dishes).forEach(dishId => {
          updates[`${dishId}/outletName`] = storeName;
          updates[`${dishId}/outletId`] = oid;
          updates[`${dishId}/businessId`] = bid;
        });

        await dishesRef.update(updates);
        const count = Object.keys(dishes).length;
        console.log(`  ✅ Updated ${count} dishes for ${oid}`);
        totalUpdated += count;
      }
    }

    console.log(`\n🎉 Migration Complete! Total MenuItems updated: ${totalUpdated}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateMenuItems();
