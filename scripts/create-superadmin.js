const admin = require('firebase-admin');
const serviceAccount = require('../bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const email = "Nexorasoftwareagency@gmail.com";
const password = process.env.SUPERADMIN_PASSWORD;
if (!password) {
  console.error('Error: SUPERADMIN_PASSWORD environment variable is required.');
  console.error('Usage: SUPERADMIN_PASSWORD="your-secure-password" node scripts/create-superadmin.js');
  process.exit(1);
}
const displayName = "Username";

async function createSuperAdmin() {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });
    
    console.log('Successfully created new SuperAdmin user:', userRecord.uid);
    
    // Set custom claims for extra security
    await admin.auth().setCustomUserClaims(userRecord.uid, { superadmin: true });
    
    // SYNC WITH DATABASE (Required for SuperAdmin dashboard gate)
    await admin.database().ref(`admins/${userRecord.uid}`).set({
        name: displayName,
        email: email,
        isSuper: true,
        role: 'SuperAdmin',
        createdAt: new Date().toISOString()
    });

    console.log('Custom claims and database record set for superadmin.');
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
        console.log('User already exists. Updating password instead...');
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, { password: password });
        await admin.auth().setCustomUserClaims(user.uid, { superadmin: true });
        
        // Sync database even on update
        await admin.database().ref(`admins/${user.uid}`).update({
            isSuper: true,
            role: 'SuperAdmin',
            updatedAt: new Date().toISOString()
        });

        console.log('User password, claims, and DB record updated.');
        process.exit(0);
    } else {
        console.error('Error creating new user:', error);
        process.exit(1);
    }
  }
}

createSuperAdmin();
