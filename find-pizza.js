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

async function findPizza() {
    try {
        const snapshot = await db.ref('/').once('value');
        const data = snapshot.val();
        
        console.log("Searching for 'Pizza' in database...");
        
        const results = [];
        
        function search(obj, path = '') {
            if (!obj) return;
            if (typeof obj === 'object') {
                for (const key in obj) {
                    const val = obj[key];
                    const currentPath = path ? `${path}/${key}` : key;
                    
                    if (key === 'name' && typeof val === 'string' && val.toLowerCase().includes('pizza')) {
                        results.push({ path: currentPath, name: val });
                    }
                    
                    if (typeof val === 'object') {
                        search(val, currentPath);
                    }
                }
            }
        }
        
        search(data);
        
        console.log(`Found ${results.length} items:`);
        results.forEach(r => console.log(`- [${r.path}] : ${r.name}`));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

findPizza();
