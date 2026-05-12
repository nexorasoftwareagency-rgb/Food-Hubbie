const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('C:\\Users\\DELL\\Downloads\\food-hubbie-firebase-adminsdk-fbsvc-4b2c8e7f78.json', 'utf8'));
const extractedData = JSON.parse(fs.readFileSync('d:\\Foodhubbie\\extracted_pizza_data.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://food-hubbie-default-rtdb.firebaseio.com/'
    });
}

const db = admin.database();

const BIZ_ID = 'business_prashant';
const OUTLET_ID = 'pizza-parsa';
const SLUG = 'pizza-parsa';

async function ingestData() {
    try {
        console.log(`🚀 Starting ingestion for ${BIZ_ID}/${OUTLET_ID}...`);

        // 1. Create/Update Business Node
        await db.ref(`businesses/${BIZ_ID}`).update({
            name: 'Prashant Group',
            status: 'Active',
            updatedAt: admin.database.ServerValue.TIMESTAMP
        });

        // 2. Prepare Outlet Data
        const outletPath = `businesses/${BIZ_ID}/outlets/${OUTLET_ID}`;
        const outletData = {
            name: 'Prashant Pizza (Parsa)',
            status: 'Active',
            meta: {
                name: 'Prashant Pizza (Parsa)',
                slug: SLUG,
                createdAt: new Date().toISOString(),
                location: {
                    address: "Near Government Hospital Parsa, Saran - 841219",
                    lat: 25.87143, // Based on botUsers data
                    lng: 84.9923783
                }
            },
            settings: {
                Store: {
                    storeName: 'Prashant Pizza (Parsa)',
                    entityName: 'Prashant Group',
                    createdAt: new Date().toISOString()
                },
                shopOpen: true
            },
            // Ingest extracted catalog
            Menu: extractedData.Menu || {},
            categories: extractedData.categories || {},
            dishes: extractedData.dishes || {},
            riderStats: extractedData.riderStats || {}
        };

        // 3. Set Outlet Data
        await db.ref(outletPath).set(outletData);
        console.log(`✅ Catalog data ingested to ${outletPath}`);

        // 4. Register Slug
        await db.ref(`slugs/outlets/${SLUG}`).set({
            businessId: BIZ_ID,
            outletId: OUTLET_ID
        });
        console.log(`✅ Slug registered: /${SLUG}`);

        console.log('🎉 Ingestion Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Ingestion Failed:', error);
        process.exit(1);
    }
}

ingestData();
