const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('C:\\Users\\DELL\\Downloads\\food-hubbie-firebase-adminsdk-fbsvc-4b2c8e7f78.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://food-hubbie-default-rtdb.firebaseio.com/'
    });
}

const db = admin.database();

async function listBusinesses() {
    try {
        const snapshot = await db.ref('businesses').once('value');
        const businesses = snapshot.val();
        console.log('Existing Businesses:', businesses ? Object.keys(businesses) : 'None');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listBusinesses();
