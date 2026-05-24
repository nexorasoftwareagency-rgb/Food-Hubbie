const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://food-hubbie-default-rtdb.firebaseio.com'
});

const db = admin.database();
const auth = admin.auth();

async function createAdmin() {
  const email = 'roshanipizza@gmail.com';
  const password = '989515';
  const businessId = 'business_roshani';
  const outletId = 'outlet_pizza';

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

    // Add/update admin entry in RTDB (both paths)
    const adminData = {
      email,
      password,
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
