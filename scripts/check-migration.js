const admin = require('firebase-admin');
const path = require('path');

const NEW_SA_PATH = path.join(__dirname, '../food-hubbie-firebase-adminsdk-fbsvc-4b2c8e7f78.json');
const NEW_DB_URL = "https://food-hubbie-default-rtdb.firebaseio.com";

const newApp = admin.initializeApp({
  credential: admin.credential.cert(require(NEW_SA_PATH)),
  databaseURL: NEW_DB_URL
});

async function check() {
  const snapshot = await newApp.database().ref('businesses/business_roshani/outlets/outlet_pizza/dishes').once('value');
  console.log("DISHES FOUND:", snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
  process.exit(0);
}

check();
