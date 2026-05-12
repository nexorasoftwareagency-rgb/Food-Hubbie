const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('../bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

const seed = async () => {
  console.log("🌱 Seeding database with Roshani outlets...");

  const BUSINESS_ID = "business_roshani";

  // 1. Create Business
  await db.ref(`businesses/${BUSINESS_ID}`).set({
    name: "Roshani Group",
    owner: "Prasant",
    status: "Active",
    createdAt: new Date().toISOString()
  });

  // 2. Create Outlets
  const outlets = {
    "outlet_pizza": {
      name: "Roshani Pizza",
      status: "Active",
      meta: {
        id: "outlet_pizza",
        businessId: BUSINESS_ID,
        name: "Roshani Pizza",
        slug: "roshani-pizza",
        createdAt: new Date().toISOString()
      },
      settings: {
        Store: {
          storeName: "Roshani Pizza",
          entityName: "Roshani Group"
        },
        shopOpen: true
      }
    },
    "outlet_cake": {
      name: "Roshani Cake",
      status: "Active",
      meta: {
        id: "outlet_cake",
        businessId: BUSINESS_ID,
        name: "Roshani Cake",
        slug: "roshani-cakes",
        createdAt: new Date().toISOString()
      },
      settings: {
        Store: {
          storeName: "Roshani Cake",
          entityName: "Roshani Group"
        },
        shopOpen: true
      }
    }
  };

  await db.ref(`businesses/${BUSINESS_ID}/outlets`).set(outlets);

  // 3. Create Slugs
  await db.ref(`slugs/outlets/roshani-pizza`).set({
    businessId: BUSINESS_ID,
    outletId: "outlet_pizza"
  });
  await db.ref(`slugs/outlets/roshani-cakes`).set({
    businessId: BUSINESS_ID,
    outletId: "outlet_cake"
  });

  console.log("✅ Database seeded successfully!");
  process.exit(0);
};

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
