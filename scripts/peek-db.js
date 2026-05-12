const admin = require('firebase-admin');
const serviceAccount = require('../bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function peek() {
  const snapshot = await db.ref('/').once('value');
  const data = snapshot.val();
  console.log("DATABASE KEYS:", Object.keys(data));
  if (data.businesses) {
      console.log("BUSINESSES:", Object.keys(data.businesses));
      const b0 = Object.keys(data.businesses)[0];
      if (data.businesses[b0].outlets) {
          console.log(`OUTLETS for ${b0}:`, Object.keys(data.businesses[b0].outlets));
      }
  }
  process.exit(0);
}

peek();
