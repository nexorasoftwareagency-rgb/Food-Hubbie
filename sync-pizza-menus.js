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

async function syncMenus() {
    try {
        console.log('🔄 Syncing Menu: Prashant Pizza -> Roshani Pizza...');

        const sourcePath = 'businesses/business_prashant/outlets/pizza-parsa';
        const targetPath = 'businesses/business_roshani/outlets/outlet_pizza';

        // 1. Fetch source data
        const sourceSnap = await db.ref(sourcePath).once('value');
        const sourceData = sourceSnap.val();

        if (!sourceData) {
            console.error('❌ Source outlet (Prashant Pizza) not found!');
            process.exit(1);
        }

        // 2. Prepare payload (Only catalog data)
        const catalogUpdates = {
            Menu: sourceData.Menu || {},
            categories: sourceData.categories || {},
            dishes: sourceData.dishes || {}
        };

        // 3. Update target
        await db.ref(targetPath).update(catalogUpdates);
        console.log(`✅ Success! Catalog copied to ${targetPath}`);

        // 4. Verification
        const targetSnap = await db.ref(targetPath).once('value');
        const targetData = targetSnap.val();
        console.log(`--- Verification ---`);
        console.log(`Target Outlet: ${targetData.name}`);
        console.log(`Categories Count: ${Object.keys(targetData.categories || {}).length}`);
        console.log(`Dishes Count: ${Object.keys(targetData.dishes || {}).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Sync Failed:', error);
        process.exit(1);
    }
}

syncMenus();
