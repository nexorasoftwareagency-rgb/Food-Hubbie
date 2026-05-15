const admin = require('firebase-admin');
const serviceAccount = require('../bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function extract() {
    const data = {};
    
    // Extract Admins
    const adminsSnap = await db.ref('admins').once('value');
    data.admins = adminsSnap.val();
    
    // Extract Riders
    const ridersSnap = await db.ref('riders').once('value');
    data.riders = ridersSnap.val();
    
    // Extract Outlets to see if passwords are stored there
    const bizSnap = await db.ref('businesses').once('value');
    data.businesses = bizSnap.val();

    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}

extract();
