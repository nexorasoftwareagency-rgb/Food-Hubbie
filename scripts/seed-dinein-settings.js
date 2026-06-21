const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('../bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

const seed = async () => {
  console.log("🌱 Seeding dine-in settings for existing outlets...");

  const BUSINESS_ID = "business_roshani";

  const defaults = {
    taxPercent: 5,
    qrBaseUrl: "https://foodhubbie-menu.web.app/",
    brandName: "Roshani",
    brandColor: "#E84908",
    tableSessionTimeout: 30,
    autoFreeTableOnBill: true,
    updatedAt: new Date().toISOString()
  };

  const outlets = ["outlet_pizza", "outlet_cake"];

  for (const outletId of outlets) {
    const ref = db.ref(`businesses/${BUSINESS_ID}/outlets/${outletId}/dineinSettings`);
    const snap = await ref.once('value');
    if (snap.exists()) {
      console.log(`  ⏭️  ${outletId}: already has dineinSettings, skipping`);
      continue;
    }
    await ref.set(defaults);
    console.log(`  ✅ ${outletId}: dineinSettings seeded`);
  }

  console.log("✅ Done!");
  process.exit(0);
};

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
