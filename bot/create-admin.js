const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://food-hubbie-default-rtdb.firebaseio.com'
});

const db = admin.database();
const auth = admin.auth();

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const businessId = process.argv[4];
  const outletId = process.argv[5];

  if (!email || !password || !businessId || !outletId) {
    console.error('Usage: node create-admin.js <email> <password> <businessId> <outletId>');
    process.exit(1);
  }

  try {
    // Check if user already exists
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('User already exists with UID:', user.uid);
    } catch {
      user = await auth.createUser({ email, password });
      console.log('Created auth user with UID:', user.uid);
    }

    // Add/update admin entry in RTDB (both paths) — no plaintext password
    const adminData = {
      email,
      businessId,
      outlet: outletId,
      role: 'business',
      phone: ''
    };
    await db.ref(`system/admins/${user.uid}`).set(adminData);
    await db.ref(`admins/${user.uid}`).set(adminData);
    console.log('Admin entry created at system/admins/' + user.uid + ' and admins/' + user.uid);

    // Also update the slug to ensure it's properly indexed
    const slugRef = db.ref('slugs/outlets/roshani-pizza');
    await slugRef.set({ businessId, outletId });
    console.log('Slug entry verified');

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

createAdmin();
