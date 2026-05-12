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

async function checkMenu() {
    try {
        const snapshot = await db.ref('businesses/business_prashant/outlets/pizza-parsa').once('value');
        const outlet = snapshot.val();
        
        if (!outlet) {
            console.error('❌ Outlet not found!');
            process.exit(1);
        }

        console.log('--- Sanity Check: Prashant Pizza (Parsa) ---');
        console.log('Name:', outlet.name);
        console.log('Status:', outlet.status);
        
        const categories = outlet.categories || {};
        const dishes = outlet.dishes || {};
        const menu = outlet.Menu || {};

        console.log('Categories Count:', Object.keys(categories).length);
        console.log('Dishes Count:', Object.keys(dishes).length);
        
        // Check Menu -> Categories mapping
        const menuCategories = menu.Categories || {};
        console.log('Menu Categories Mapping Count:', Object.keys(menuCategories).length);

        // Sample verification
        const firstCatId = Object.keys(categories)[0];
        if (firstCatId) {
            console.log(`Sample Category [${firstCatId}]:`, categories[firstCatId].name);
        }

        const firstDishId = Object.keys(dishes)[0];
        if (firstDishId) {
            console.log(`Sample Dish [${firstDishId}]:`, dishes[firstDishId].name);
        }

        // Verify Slug registration
        const slugSnap = await db.ref('slugs/outlets/pizza-parsa').once('value');
        console.log('Slug Registration:', slugSnap.val() ? '✅ Valid' : '❌ MISSING');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkMenu();
